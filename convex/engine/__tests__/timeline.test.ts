import { describe, expect, it } from "vitest";
import {
  CLEAR_ANIM_MS,
  FALL_ANIM_MS,
  GAME_DURATION_MS,
  JITTER_MS,
  SWAP_ANIM_MS,
  WALLCLOCK_TOLERANCE_MS,
} from "../config";
import {
  applySwap,
  createGame,
  type GameMode,
  type ReplayAction,
  replay,
  wallClockInvalid,
} from "../engine";
import { findFirstHintMove } from "../matches";

// Builds two consecutive legal swaps for a seed and reports the wall-clock
// lock duration of the first one, so timing-edge cases can be probed exactly.
function twoLegalMoves(seed: number, mode: GameMode) {
  const s = createGame(seed, mode);
  const h1 = findFirstHintMove(s.board);
  if (!h1) throw new Error("no first hint");
  const [f1, t1] = h1;
  const r1 = applySwap(s, f1, t1, 0);
  if (!r1.ok) throw new Error("first move illegal");
  const firstDuration =
    SWAP_ANIM_MS + r1.steps.length * (CLEAR_ANIM_MS + FALL_ANIM_MS);
  const h2 = findFirstHintMove(s.board);
  if (!h2) throw new Error("no second hint");
  const [f2, t2] = h2;
  return { f1, t1, f2, t2, firstDuration };
}

describe("timeline validation — action gap", () => {
  const seed = 31337;
  const { f1, t1, f2, t2, firstDuration } = twoLegalMoves(seed, "normal");

  it("accepts a gap >= first animation duration (minus jitter)", () => {
    const actions: ReplayAction[] = [
      { t: 0, type: "swap", from: f1, to: t1 },
      {
        t: firstDuration - JITTER_MS + 10,
        type: "swap",
        from: f2,
        to: t2,
      },
    ];
    const r = replay(seed, "normal", actions);
    expect(r.invalid).toBe(false);
    expect(r.timelineInvalid).toBe(false);
  });

  it("flags a gap smaller than the animation lock (beyond jitter)", () => {
    const actions: ReplayAction[] = [
      { t: 0, type: "swap", from: f1, to: t1 },
      {
        t: firstDuration - JITTER_MS - 50,
        type: "swap",
        from: f2,
        to: t2,
      },
    ];
    const r = replay(seed, "normal", actions);
    // Rule-valid (both moves legal) but physically impossible timing.
    expect(r.invalid).toBe(false);
    expect(r.timelineInvalid).toBe(true);
    expect(r.timelineReason).toBe("gap-too-small");
  });
});

describe("timeline validation — time budget", () => {
  it("flags a normal-mode action past the time budget", () => {
    const seed = 31337;
    const s = createGame(seed, "normal");
    const h = findFirstHintMove(s.board);
    if (!h) throw new Error("no hint");
    const [from, to] = h;
    const r = replay(seed, "normal", [
      {
        t: GAME_DURATION_MS + JITTER_MS + 5_000,
        type: "swap",
        from,
        to,
      },
    ]);
    expect(r.invalid).toBe(false);
    expect(r.timelineInvalid).toBe(true);
    expect(r.timelineReason).toBe("over-budget");
  });

  it("does not budget-flag the same action span in zen mode", () => {
    const seed = 31337;
    const s = createGame(seed, "zen");
    const h = findFirstHintMove(s.board);
    if (!h) throw new Error("no hint");
    const [from, to] = h;
    const r = replay(seed, "zen", [
      {
        t: GAME_DURATION_MS + JITTER_MS + 5_000,
        type: "swap",
        from,
        to,
      },
    ]);
    expect(r.timelineInvalid).toBe(false);
  });

  it("non-monotonic timestamps are flagged", () => {
    const { f1, t1, f2, t2 } = twoLegalMoves(31337, "normal");
    const r = replay(31337, "normal", [
      { t: 10_000, type: "swap", from: f1, to: t1 },
      { t: 5_000, type: "swap", from: f2, to: t2 },
    ]);
    expect(r.timelineInvalid).toBe(true);
  });
});

describe("wallClockInvalid pure helper", () => {
  const actions: ReplayAction[] = [
    { t: 0, type: "swap", from: { row: 0, col: 0 }, to: { row: 0, col: 1 } },
    {
      t: GAME_DURATION_MS,
      type: "swap",
      from: { row: 0, col: 0 },
      to: { row: 0, col: 1 },
    },
  ];

  it("flags a too-fast submission (60s game submitted in 1s)", () => {
    expect(wallClockInvalid(1_000, actions)).toBe(true);
  });

  it("accepts real elapsed within the tolerance band", () => {
    expect(
      wallClockInvalid(GAME_DURATION_MS - WALLCLOCK_TOLERANCE_MS + 100, actions),
    ).toBe(false);
  });

  it("accepts real elapsed longer than virtual (pauses)", () => {
    expect(wallClockInvalid(GAME_DURATION_MS + 120_000, actions)).toBe(false);
  });

  it("never flags an empty action log", () => {
    expect(wallClockInvalid(0, [])).toBe(false);
  });
});
