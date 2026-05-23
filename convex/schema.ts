import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const actionValidator = v.object({
  t: v.number(),
  type: v.union(v.literal("swap"), v.literal("ult")),
  from: v.optional(v.object({ row: v.number(), col: v.number() })),
  to: v.optional(v.object({ row: v.number(), col: v.number() })),
  element: v.optional(
    v.union(
      v.literal("ori"),
      v.literal("green"),
      v.literal("electric"),
      v.literal("chaotic"),
      v.literal("night"),
      v.literal("sakura"),
    ),
  ),
});

export default defineSchema({
  leaderboard: defineTable({
    nickname: v.string(),
    score: v.number(),
    hearts: v.number(),
    mode: v.union(v.literal("normal"), v.literal("zen")),
    createdAt: v.number(),
    // Set when server replay validation failed. Absent = not flagged (legacy
    // rows stay visible). Flagged rows are hidden from the public top.
    flagged: v.optional(v.boolean()),
    // Human-readable reason a run was flagged/banned (e.g. "rule:no-match",
    // "timeline:gap-too-small", "wall-clock", "shape", "duplicate-session").
    // Absent when the run passed validation. Multiple reasons are "; "-joined.
    flagReason: v.optional(v.string()),
    // Full replay log submitted by the client. Optional for legacy rows that
    // predate this column.
    actions: v.optional(v.array(actionValidator)),
  })
    .index("by_score", ["score"])
    .index("by_mode_and_score", ["mode", "score"]),

  gameSessions: defineTable({
    seed: v.number(),
    mode: v.union(v.literal("normal"), v.literal("zen")),
    startedAt: v.number(),
    status: v.union(v.literal("active"), v.literal("submitted")),
  }),

  chat: defineTable({
    clientId: v.string(),
    nickname: v.string(),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_clientId_and_createdAt", ["clientId", "createdAt"]),
});
