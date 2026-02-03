import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import z from "zod";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";

const requestSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
});

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalKey = process.env.CONVEX_INTERNAL_KEY;

    if (!internalKey) {
      return NextResponse.json(
        { error: "Internal key not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { conversationId, message } = requestSchema.parse(body);

    const conversation = await convex.query(api.system.getConversationById, {
      conversationId: conversationId as Id<"conversations">,
      internalKey,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const projectId = conversation.projectId;

    // find all processing messages in this project
    const processingMessages = await convex.query(
      api.system.getProcessingMessages,
      { internalKey, projectId },
    );

    if (processingMessages.length > 0) {
      // cancel all processing messages
      await Promise.all(
        processingMessages.map(async (msg) => {
          await inngest.send({
            name: "message/cancel",
            data: {
              messageId: msg._id,
            },
          });

          await convex.mutation(api.system.updateMessageStatus, {
            internalKey,
            messageId: msg._id,
            status: "cancelled",
          });
        }),
      );
    }

    await convex.mutation(api.system.createMessage, {
      internalKey,
      content: message,
      conversationId: conversationId as Id<"conversations">,
      projectId,
      role: "user",
    });

    const assistantMessageId = await convex.mutation(api.system.createMessage, {
      internalKey,
      conversationId: conversationId as Id<"conversations">,
      projectId,
      role: "assistant",
      content: "",
      status: "processing",
    });

    const event = await inngest.send({
      name: "message/sent",
      data: {
        messageId: assistantMessageId,
        conversationId,
        projectId,
        message,
      },
    });

    return NextResponse.json({
      success: true,
      eventId: event.ids[0],
      messageId: assistantMessageId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate edit" },
      { status: 500 },
    );
  }
}
