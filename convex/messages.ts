import { v } from "convex/values";

import { query } from "@/convex/_generated/server";
import { verifyAuth } from "@/convex/auth";

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const convsersation = await ctx.db.get(
      "conversations",
      args.conversationId,
    );

    if (!convsersation) {
      throw new Error("Project not found");
    }

    const project = await ctx.db.get("projects", convsersation.projectId);

    if (!project) {
      throw new Error("Project not found");
    }

    if (project.ownerId !== identity.subject) {
      throw new Error("Unauthorized access to this project");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (query) =>
        query.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();
  },
});
