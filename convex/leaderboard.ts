import { v } from "convex/values";
import { query } from "./_generated/server";

const TOP_LIMIT = 20;

// Upper bound on how deep we scan to resolve an out-of-top rank. Keeps the
// query cheap as the table grows; past this depth we just skip the strip.
const RANK_SCAN_LIMIT = 1000;

// Public top scores. Server-flagged runs (failed replay / timeline / wall-clock
// validation) are currently shown alongside clean runs; `flagged` is still
// stored on the row if hiding needs to be re-enabled later.
export const getTopScores = query({
  args: { mode: v.union(v.literal("normal"), v.literal("zen")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("leaderboard")
      .withIndex("by_mode_and_score", (q) => q.eq("mode", args.mode))
      .order("desc")
      .take(TOP_LIMIT);
  },
});

// Rank-context strip for a just-submitted entry. Returns null when the entry
// is not found or already inside the visible top (getTopScores already shows
// & highlights it there). Otherwise returns the player's rank plus the
// n-1 / n / n+1 slice so the UI can render it under an ellipsis.
// Scan order mirrors getTopScores so ranks stay consistent.
export const getRankContext = query({
  args: {
    entryId: v.id("leaderboard"),
    mode: v.union(v.literal("normal"), v.literal("zen")),
  },
  handler: async (ctx, args) => {
    const target = await ctx.db.get(args.entryId);
    if (target === null || target.mode !== args.mode) return null;

    const ranked = await ctx.db
      .query("leaderboard")
      .withIndex("by_mode_and_score", (q) => q.eq("mode", args.mode))
      .order("desc")
      .take(RANK_SCAN_LIMIT);

    const idx = ranked.findIndex((r) => r._id === args.entryId);
    if (idx === -1) return null;

    const rank = idx + 1;
    if (rank <= TOP_LIMIT) return null;

    // n-1 / n / n+1, but skip any neighbour still inside the visible top —
    // it's already rendered there (e.g. for rank 21, n-1 is rank 20).
    const slice = [];
    for (let i = idx - 1; i <= idx + 1; i++) {
      const entry = ranked[i];
      if (entry && i + 1 > TOP_LIMIT) slice.push({ rank: i + 1, entry });
    }

    return {
      rank,
      slice,
      // True only when a gap separates the top list from the strip.
      hasGapAbove: slice[0].rank > TOP_LIMIT + 1,
      // There are lower-ranked entries past the slice → trailing ellipsis.
      hasMoreBelow: idx + 1 < ranked.length - 1,
    };
  },
});
