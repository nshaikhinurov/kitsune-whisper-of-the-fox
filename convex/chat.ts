import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getRecentMessages = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("chat")
      .withIndex("by_createdAt")
      .order("desc")
      .take(50);
    return messages.reverse();
  },
});

export const sendMessage = mutation({
  args: {
    clientId: v.string(),
    nickname: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const nickname = args.nickname.trim();
    const content = args.content.trim();

    if (nickname.length < 1 || nickname.length > 24) {
      throw new ConvexError("Nickname must be 1–24 characters.");
    }
    if (content.length < 1 || content.length > 280) {
      throw new ConvexError("Message must be 1–280 characters.");
    }
    if (args.clientId.length < 1) {
      throw new ConvexError("Invalid client ID.");
    }

    const oneMinuteAgo = Date.now() - 60_000;
    const recentMessages = await ctx.db
      .query("chat")
      .withIndex("by_clientId_and_createdAt", (q) =>
        q.eq("clientId", args.clientId).gte("createdAt", oneMinuteAgo),
      )
      .take(20);

    if (recentMessages.length >= 20) {
      throw new ConvexError("Rate limit: max 20 messages per minute.");
    }

    await ctx.db.insert("chat", {
      clientId: args.clientId,
      nickname,
      content,
      createdAt: Date.now(),
    });
  },
});
