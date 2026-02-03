import { anthropic, createAgent, createNetwork } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";

import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  CODING_AGENT_SYSTEM_PROMPT,
  TITLE_GENERATOR_SYSTEM_PROMPT,
} from "@/features/conversations/inngest/constants";
import {
  createCreateFilesTool,
  createCreateFolderTool,
  createDeleteFilesTool,
  createListFilesTool,
  createReadFilesTool,
  createRenameFileTool,
  createScrapeUrlsTool,
  createUpdateFileTool,
} from "@/features/conversations/inngest/tools";
import { inngest } from "@/inngest/client";
import { DEFAULT_CONVERSATION_TITLE } from "@/lib/constants";
import { convex } from "@/lib/convex-client";

interface MessageEvent {
  messageId: Id<"messages">;
  conversationId: Id<"conversations">;
  projectId: Id<"projects">;
  message: Doc<"messages">["content"];
}

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    cancelOn: [
      {
        event: "message/cancel",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step }) => {
      const { messageId } = event.data.event.data as MessageEvent;

      const internalKey = process.env.CONVEX_INTERNAL_KEY;

      // Update the message with error content
      if (internalKey) {
        await step.run("update-message-on-failure", async () => {
          await convex.mutation(api.system.updateMessageContent, {
            internalKey,
            messageId,
            content:
              "My apologies, I encountered an error while processing your request. Let me know if you need anything else!",
          });
        });
      }
    },
  },
  {
    event: "message/sent",
  },
  async ({ event, step }) => {
    const { messageId, conversationId, projectId, message } =
      event.data as MessageEvent;

    const internalKey = process.env.CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      throw new NonRetriableError(
        "POLARIS_CONVEX_INTERNAL_KEY is not configured",
      );
    }

    await step.sleep("wait-for-db-sync", "1s");

    // get conversation for title generation check
    const conversation = await step.run("get-conversation", async () => {
      return await convex.query(api.system.getConversationById, {
        internalKey,
        conversationId,
      });
    });

    if (!conversation) {
      throw new NonRetriableError("Conversation not found");
    }

    // fetch recent messages for conversation context
    const recentMessages = await step.run("get-recent-messages", async () => {
      return await convex.query(api.system.getRecentMessages, {
        internalKey,
        conversationId,
        limit: 10,
      });
    });

    // build system prompt with conversation history (exclude current processing message)
    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    // filter out current processing messages and empty messages
    const contextMessages = recentMessages.filter(
      (msg) => msg._id !== messageId && msg.content.trim() !== "",
    );

    if (contextMessages.length > 0) {
      const historyText = contextMessages
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join("\n\n");

      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nResponse ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    // generate conversation title if it's still the default
    const shouldGenerateTitle =
      conversation.title === DEFAULT_CONVERSATION_TITLE;

    if (shouldGenerateTitle) {
      const titleAgent = createAgent({
        name: "title-generator",
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        model: anthropic({
          model: "claude-3-5-haiku-latest",
          defaultParameters: { temperature: 0, max_tokens: 50 },
        }),
      });

      const { output } = await titleAgent.run(message, { step });

      const textMessage = output.find(
        (msg) => msg.type === "text" && msg.role === "assistant",
      );

      if (textMessage?.type === "text") {
        const title =
          typeof textMessage.content === "string"
            ? textMessage.content.trim()
            : textMessage.content
                .map((c) => c.text)
                .join("")
                .trim();

        if (title) {
          await step.run("update-conversation-title", async () => {
            await convex.mutation(api.system.updateConversationTitle, {
              internalKey,
              conversationId,
              title,
            });
          });
        }
      }
    }

    // create the coding agent with file tools
    const codingAgent = createAgent({
      name: "cursor-clone",
      description: "Expert AI coding assistant",
      system: systemPrompt,
      model: anthropic({
        model: "claude-opus-4-20250514",
        defaultParameters: { temperature: 3, max_tokens: 16_000 },
      }),
      tools: [
        createCreateFilesTool({ internalKey, projectId }),
        createCreateFolderTool({ internalKey, projectId }),
        createDeleteFilesTool({ internalKey }),
        createListFilesTool({ internalKey, projectId }),
        createReadFilesTool({ internalKey }),
        createRenameFileTool({ internalKey }),
        createScrapeUrlsTool(),
        createUpdateFileTool({ internalKey }),
      ],
    });

    const network = createNetwork({
      name: "cursor-clone-network",
      agents: [codingAgent],
      maxIter: 20,
      router: ({ network }) => {
        const lastResult = network.state.results.at(-1);
        const hasTextResponse = lastResult?.output?.some(
          (msg) => msg.type === "text" && msg.role === "assistant",
        );
        const hasToolCalls = lastResult?.output?.some(
          (msg) => msg.type === "tool_call",
        );

        if (hasTextResponse && !hasToolCalls) {
          return undefined;
        }

        return codingAgent;
      },
    });

    const result = await network.run(message);

    // extract the assistant's text response from last agent result
    const lastResult = result.state.results.at(-1);
    const textMessage = lastResult?.output?.find(
      (msg) => msg.type === "text" && msg.role === "assistant",
    );

    let assistantResopnse =
      "I processed the request. Let me know if you need anything else!";

    if (textMessage?.type === "text") {
      assistantResopnse =
        typeof textMessage?.content === "string"
          ? textMessage.content
          : textMessage.content.map((c) => c.text).join("");
    }

    // update the assistant message with the response
    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        internalKey,
        messageId,
        content: assistantResopnse,
      });
    });

    return { success: true, messageId, conversationId };
  },
);
