import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Moderation helper: clear a false-positive validation flag from leaderboard
// rows (e.g. runs flagged `timeline:over-budget` because the pre-fix client
// countdown subtracted a fixed step per setInterval tick and drifted behind
// the wall clock the action log is stamped with).
//
// Run with: npx convex run admin:unflagRuns '{"ids": ["<leaderboard id>", ...]}'
export const unflagRuns = internalMutation({
  args: { ids: v.array(v.id("leaderboard")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      const row = await ctx.db.get(id);
      if (!row) throw new Error(`leaderboard row not found: ${id}`);
      await ctx.db.patch(id, { flagged: undefined, flagReason: undefined });
    }
    return args.ids.length;
  },
});
