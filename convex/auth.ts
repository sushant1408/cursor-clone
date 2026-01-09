import type { MutationCtx, QueryCtx } from "./_generated/server";

async function verifyAuth(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error("Unauthorized");
  }

  return identity;
}

export { verifyAuth };
