import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leaderboard: defineTable({
    nickname: v.string(),
    score: v.number(),
    hearts: v.number(),
    mode: v.union(v.literal("normal"), v.literal("zen")),
    createdAt: v.number(),
  }).index("by_score", ["score"]),
});
