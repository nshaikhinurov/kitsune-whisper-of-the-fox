import { v } from "convex/values";
import { query } from "./_generated/server";

const TOP_LIMIT = 20;

// Public top scores. Server-flagged runs (failed replay / timeline / wall-clock
// validation) are hidden: over-fetch on the score-ordered index then filter,
// since `flagged` is sparse and a dedicated index isn't worth it at this size.
export const getTopScores = query({
  args: { mode: v.union(v.literal("normal"), v.literal("zen")) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("leaderboard")
      .withIndex("by_mode_and_score", (q) => q.eq("mode", args.mode))
      .order("desc")
      .take(TOP_LIMIT * 4);
    return rows.filter((r) => r.flagged !== true).slice(0, TOP_LIMIT);
  },
});
