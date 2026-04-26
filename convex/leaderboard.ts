import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getTopScores = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query("leaderboard").withIndex("by_score").order("desc").take(20),
});

export const submitScore = mutation({
  args: {
    nickname: v.string(),
    score: v.number(),
    stars: v.number(),
    mode: v.union(v.literal("normal"), v.literal("zen")),
  },
  handler: async (ctx, args) => {
    const trimmed = args.nickname.trim();
    if (trimmed.length === 0 || trimmed.length > 24)
      throw new Error("Nickname must be 1–24 characters");
    if (args.score < 0 || args.score > 1_000_000)
      throw new Error("Score out of range");
    if (args.stars < 0 || args.stars > 1000)
      throw new Error("Stars out of range");
    return ctx.db.insert("leaderboard", {
      ...args,
      nickname: trimmed,
      createdAt: Date.now(),
    });
  },
});
