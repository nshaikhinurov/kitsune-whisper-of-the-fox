import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  type ReplayAction,
  replay,
  wallClockInvalid,
} from "./engine/engine";

// Server issues the game seed so the client cannot pick a favorable board ahead
// of time. The seed + the client's recorded action log let the server replay
// and recompute the true score.
export const startGame = mutation({
  args: { mode: v.union(v.literal("normal"), v.literal("zen")) },
  handler: async (ctx, args) => {
    const seed = Math.floor(Math.random() * 0x100000000) >>> 0;
    const gameId = await ctx.db.insert("gameSessions", {
      seed,
      mode: args.mode,
      startedAt: Date.now(),
      status: "active",
    });
    return { gameId, seed };
  },
});

// Server-authoritative score submission. The client sends only the recorded
// action log; the server replays it against the session's seed and stores the
// replayed score. The client-sent score is never trusted. Runs that fail
// rule / timeline / wall-clock validation are still inserted but `flagged`,
// which hides them from the public leaderboard (shadow flag, not hard reject).
export const submitRun = mutation({
  args: {
    gameId: v.id("gameSessions"),
    nickname: v.string(),
    actions: v.array(
      v.object({
        t: v.number(),
        type: v.union(v.literal("swap"), v.literal("ult")),
        from: v.optional(
          v.object({ row: v.number(), col: v.number() }),
        ),
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
      }),
    ),
  },
  handler: async (ctx, args) => {
    // Protocol errors throw (malformed input, not gameplay).
    const nickname = args.nickname.trim();
    if (nickname.length < 1 || nickname.length > 24) {
      throw new ConvexError("Nickname must be 1–24 characters.");
    }

    const session = await ctx.db.get(args.gameId);
    if (session === null) {
      throw new ConvexError("Unknown game session.");
    }

    // Normalize into ReplayAction[]; a shape mismatch (swap without from/to,
    // ult without element) is a gameplay anomaly → shadow-flag, don't throw.
    let shapeInvalid = false;
    const actions: ReplayAction[] = [];
    for (const a of args.actions) {
      if (a.type === "swap") {
        if (a.from && a.to) {
          actions.push({ t: a.t, type: "swap", from: a.from, to: a.to });
        } else {
          shapeInvalid = true;
        }
      } else {
        if (a.element) {
          actions.push({ t: a.t, type: "ult", element: a.element });
        } else {
          shapeInvalid = true;
        }
      }
    }

    const r = replay(session.seed, session.mode, actions);
    const wallInvalid = wallClockInvalid(
      Date.now() - session.startedAt,
      actions,
    );

    // One-shot anti-replay: a session can only be scored once. A reused
    // session is force-flagged regardless of replay outcome.
    const alreadySubmitted = session.status === "submitted";
    if (!alreadySubmitted) {
      await ctx.db.patch(args.gameId, { status: "submitted" });
    }

    const flagged =
      r.invalid ||
      r.timelineInvalid ||
      wallInvalid ||
      shapeInvalid ||
      alreadySubmitted;

    return ctx.db.insert("leaderboard", {
      nickname,
      score: r.score,
      hearts: r.hearts,
      mode: session.mode,
      createdAt: Date.now(),
      flagged,
    });
  },
});
