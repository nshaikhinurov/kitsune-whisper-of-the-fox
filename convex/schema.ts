import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  leaderboard: defineTable({
    nickname: v.string(),
    score: v.number(),
    hearts: v.number(),
    mode: v.union(v.literal("normal"), v.literal("zen")),
    createdAt: v.number(),
  })
    .index("by_score", ["score"])
    .index("by_mode_and_score", ["mode", "score"]),

  chat: defineTable({
    clientId: v.string(),
    nickname: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_clientId_and_createdAt", ["clientId", "createdAt"]),
});
