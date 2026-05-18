import { describe, expect, it } from "vitest";
import {
  applySwap,
  createGame,
  type GameMode,
  type ReplayAction,
  replay,
} from "../engine";
import { findFirstHintMove } from "../matches";

// Plays a deterministic legal game by always taking the first hinted move
// (guaranteed to produce a match). `gap` is the synthetic ms between actions.
function playout(seed: number, mode: GameMode, gap: number, maxMoves = 60) {
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
    t += gap;
  }
  return { score: s.score, hearts: s.hearts, over: s.over, actions };
}

describe("engine determinism", () => {
  it("createGame produces an identical board for the same seed", () => {
    const a = createGame(777, "normal");
    const b = createGame(777, "normal");
    expect(a.board).toEqual(b.board);
  });

  it("same seed + same timing → identical score and hearts", () => {
    const r1 = playout(2024, "normal", 800);
    const r2 = playout(2024, "normal", 800);
    expect(r1.actions.length).toBeGreaterThan(3);
    expect(r2.score).toBe(r1.score);
    expect(r2.hearts).toBe(r1.hearts);
  });

  it("replay() reproduces the score of the live playthrough", () => {
    const live = playout(31337, "normal", 700);
    const rr = replay(31337, "normal", live.actions);
    expect(rr.score).toBe(live.score);
    expect(rr.hearts).toBe(live.hearts);
    expect(rr.invalid).toBe(false);
  });

  it("different seeds generally diverge", () => {
    const a = playout(1, "normal", 800);
    const b = playout(2, "normal", 800);
    expect(a.score === b.score && a.actions.length === b.actions.length).toBe(
      false,
    );
  });
});

describe("combo timeline (option B)", () => {
  it("retained combo (tight timing) scores >= reset combo (huge gaps)", () => {
    const live = playout(8675309, "normal", 600);
    expect(live.actions.length).toBeGreaterThan(5);

    const tight = replay(8675309, "normal", live.actions);

    // Re-time the SAME moves with gaps far beyond COMBO_RESET_MS so combo
    // resets before every action. Board states (and thus base scores) are
    // identical; only the multiplier differs.
    const loosened: ReplayAction[] = live.actions.map((a, i) => ({
      ...a,
      t: i * 10_000_000,
    }));
    const loose = replay(8675309, "normal", loosened);

    expect(tight.score).toBe(live.score);
    expect(tight.score).toBeGreaterThan(loose.score);
  });
});

describe("invalid replays are reported (not thrown)", () => {
  it("flags a non-adjacent swap", () => {
    const rr = replay(5, "normal", [
      { t: 0, type: "swap", from: { row: 0, col: 0 }, to: { row: 5, col: 5 } },
    ]);
    expect(rr.invalid).toBe(true);
  });

  it("an appended illegal move is flagged and does not change the score", () => {
    const live = playout(404, "normal", 500);
    const tampered: ReplayAction[] = [
      ...live.actions,
      // Non-adjacent → rejected by applySwap, score untouched.
      { t: 9e8, type: "swap", from: { row: 0, col: 0 }, to: { row: 5, col: 5 } },
    ];
    const rr = replay(404, "normal", tampered);
    expect(rr.invalid).toBe(true);
    expect(rr.score).toBe(live.score);
  });
});
