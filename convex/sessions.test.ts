/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import {
  CLEAR_ANIM_MS,
  FALL_ANIM_MS,
  SWAP_ANIM_MS,
} from "./engine/config";
import {
  applySwap,
  createGame,
  type GameMode,
  type ReplayAction,
  replay,
} from "./engine/engine";
import { findFirstHintMove } from "./engine/matches";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

// A legal, timeline-valid action log for `seed`: each move starts exactly when
// the previous animation lock ends (passes the gap check) and the whole span
// stays inside the time budget.
function legalActions(
  seed: number,
  mode: GameMode,
  maxMoves = 8,
): { actions: ReplayAction[]; lastT: number } {
  const s = createGame(seed, mode);
  const actions: ReplayAction[] = [];
  let t = 0;
  for (let i = 0; i < maxMoves && !s.over; i++) {
    const hint = findFirstHintMove(s.board);
    if (!hint) break;
    const [from, to] = hint;
    const res = applySwap(s, from, to, t);
    if (!res.ok) break;
    actions.push({ t, type: "swap", from, to });
    t += SWAP_ANIM_MS + res.steps.length * (CLEAR_ANIM_MS + FALL_ANIM_MS);
  }
  return { actions, lastT: actions.length ? actions[actions.length - 1].t : 0 };
}

beforeEach(() => {
  // Fake only Date so awaited promises (microtasks) aren't affected.
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("submitRun — happy path", () => {
  it("stores the server-replayed score, unflagged, and lists it", async () => {
    const t = convexTest(schema, modules);
    const { gameId, seed } = await t.mutation(api.sessions.startGame, {
      mode: "normal",
    });

    const { actions, lastT } = legalActions(seed, "normal");
    const expected = replay(seed, "normal", actions);
    expect(expected.invalid).toBe(false);
    expect(expected.timelineInvalid).toBe(false);

    // Advance the wall clock past the virtual end so the wall-clock
    // cross-check passes.
    vi.setSystemTime(Date.now() + lastT + 3_000);

    await t.mutation(api.sessions.submitRun, {
      gameId,
      nickname: "  Murka  ",
      actions,
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("leaderboard").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].score).toBe(expected.score);
    expect(rows[0].hearts).toBe(expected.hearts);
    expect(rows[0].nickname).toBe("Murka");
    expect(rows[0].flagged).toBe(false);

    const top = await t.query(api.leaderboard.getTopScores, {
      mode: "normal",
    });
    expect(top).toHaveLength(1);
    expect(top[0].score).toBe(expected.score);
  });
});

describe("submitRun — tampering is shadow-flagged", () => {
  it("flags a forged action log but still lists it in the public top", async () => {
    const t = convexTest(schema, modules);
    const { gameId, seed } = await t.mutation(api.sessions.startGame, {
      mode: "normal",
    });

    const { actions, lastT } = legalActions(seed, "normal");
    const tampered: ReplayAction[] = [
      ...actions,
      // Non-adjacent swap → rule-invalid, score unaffected.
      { t: lastT + 800, type: "swap", from: { row: 0, col: 0 }, to: { row: 5, col: 5 } },
    ];

    vi.setSystemTime(Date.now() + lastT + 5_000);

    await t.mutation(api.sessions.submitRun, {
      gameId,
      nickname: "Cheater",
      actions: tampered,
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("leaderboard").collect(),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].flagged).toBe(true);

    const top = await t.query(api.leaderboard.getTopScores, {
      mode: "normal",
    });
    expect(top).toHaveLength(1);
    expect(top[0].flagged).toBe(true);
  });
});

describe("submitRun — one-shot anti-replay", () => {
  it("flags a second submission that reuses the same session", async () => {
    const t = convexTest(schema, modules);
    const { gameId, seed } = await t.mutation(api.sessions.startGame, {
      mode: "normal",
    });

    const { actions, lastT } = legalActions(seed, "normal");
    vi.setSystemTime(Date.now() + lastT + 3_000);

    await t.mutation(api.sessions.submitRun, {
      gameId,
      nickname: "First",
      actions,
    });
    await t.mutation(api.sessions.submitRun, {
      gameId,
      nickname: "Replay",
      actions,
    });

    const rows = await t.run(async (ctx) =>
      ctx.db.query("leaderboard").withIndex("by_score").collect(),
    );
    expect(rows).toHaveLength(2);
    const first = rows.find((r) => r.nickname === "First");
    const second = rows.find((r) => r.nickname === "Replay");
    expect(first?.flagged).toBe(false);
    expect(second?.flagged).toBe(true);
  });
});

describe("submitRun — protocol errors throw", () => {
  it("rejects a blank nickname", async () => {
    const t = convexTest(schema, modules);
    const { gameId } = await t.mutation(api.sessions.startGame, {
      mode: "normal",
    });
    await expect(
      t.mutation(api.sessions.submitRun, {
        gameId,
        nickname: "   ",
        actions: [],
      }),
    ).rejects.toThrow();
  });
});

describe("getTopScores — includes flagged rows", () => {
  it("returns all rows in score order regardless of flagged", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      await ctx.db.insert("leaderboard", {
        nickname: "Clean",
        score: 100,
        hearts: 1,
        mode: "normal",
        createdAt: Date.now(),
        flagged: false,
      });
      await ctx.db.insert("leaderboard", {
        nickname: "Forged",
        score: 999_999,
        hearts: 9,
        mode: "normal",
        createdAt: Date.now(),
        flagged: true,
      });
      await ctx.db.insert("leaderboard", {
        nickname: "Legacy",
        score: 50,
        hearts: 0,
        mode: "normal",
        createdAt: Date.now(),
      });
    });

    const top = await t.query(api.leaderboard.getTopScores, {
      mode: "normal",
    });
    expect(top.map((r) => r.nickname)).toEqual(["Forged", "Clean", "Legacy"]);
  });
});
