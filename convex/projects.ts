import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./auth";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      ownerId: identity.subject,
      updatedAt: Date.now(),
    });

    return projectId;
  },
});

export const getPartial = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const query = await ctx.db
      .query("projects")
      .withIndex("by_owner", (query) => query.eq("ownerId", identity.subject))
      .order("desc")
      .take(args.limit);

    return query;
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);

    const query = await ctx.db
      .query("projects")
      .withIndex("by_owner", (query) => query.eq("ownerId", identity.subject))
      .order("desc")
      .collect();

    return query;
  },
});
