import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLEAR_ANIM_MS,
  FALL_ANIM_MS,
  SWAP_ANIM_MS,
} from "@engine/config";
import { replay, type ReplayAction } from "@engine/engine";
import { findFirstHintMove } from "@engine/matches";
import { useGameState } from "../use-game-state";

// The engine's replay() is meant to reproduce, score-for-score, what the React
// hook awarded the player. The two are independent transcriptions of the same
// rules (one a compact loop, one a setTimeout-driven phase machine), so only a
// test that drives the *real* hook can guard that contract — an engine-vs-engine
// test is self-consistent by construction and would miss real divergence (e.g.
// the swap combo-reset boundary being SWAP_ANIM_MS off).
//
// Audition touches HTMLMediaElement at import; stub it so jsdom stays quiet.
vi.mock("~/shared/lib/audition", () => ({
  Audition: new Proxy({}, { get: () => () => {} }),
}));

beforeEach(() => {
  // Fake the timers AND the clock the hook reads: phase animations and the
  // combo-reset timer run on setTimeout; recorded action `t` comes from
  // performance.now(). Faking both makes the playthrough fully deterministic.
  vi.useFakeTimers({
    toFake: [
      "setTimeout",
      "clearTimeout",
      "setInterval",
      "clearInterval",
      "Date",
      "performance",
    ],
  });
});

afterEach(() => {
  vi.useRealTimers();
});

type Hook = ReturnType<typeof useGameState>;

// Plays one hinted (guaranteed-matching) swap and lets its full cascade animate
// to completion by stepping the fake clock through exactly the phase chain
// "swapping" -> ("clearing" -> "falling")* — no overshoot, so the countdown
// timer only consumes the real animation lock, just like a live player.
function playOneMove(
  result: { current: Hook },
  from: { row: number; col: number },
  to: { row: number; col: number },
): void {
  act(() => result.current.swipeSwap(from, to));
  act(() => vi.advanceTimersByTime(SWAP_ANIM_MS));
  let guard = 0;
  while (
    (result.current.state.phase === "clearing" ||
      result.current.state.phase === "falling") &&
    guard++ < 200
  ) {
    act(() => vi.advanceTimersByTime(CLEAR_ANIM_MS));
    act(() => vi.advanceTimersByTime(FALL_ANIM_MS));
  }
}

// Drives the hook through up to `maxMoves` hinted swaps with a caller-supplied
// idle gap before each move (the lever that does/doesn't cross the 2s combo
// reset, the exact thing replay() must mirror).
function playGame(seed: number, gaps: number[], maxMoves = 12) {
  const { result } = renderHook(() =>
    useGameState(false, false, seed, "game-1"),
  );

  for (let i = 0; i < maxMoves; i++) {
    if (result.current.state.phase === "gameOver") break;
    const hint = findFirstHintMove(result.current.state.board);
    if (!hint) break;

    if (i > 0) act(() => vi.advanceTimersByTime(gaps[i % gaps.length]));
    if (result.current.state.phase !== "idle") break;

    playOneMove(result, hint[0], hint[1]);
  }

  return {
    score: result.current.state.score,
    hearts: result.current.state.hearts,
    actions: result.current.getActionLog() as ReplayAction[],
  };
}

describe("client/server scoring parity", () => {
  // Mix of seeds × gap rhythms. Gaps straddle COMBO_RESET_MS (2000): some keep
  // the combo alive, some land in the narrow window right after a reset where
  // the swap-animation offset used to make the server keep a combo the client
  // had already cleared.
  const seeds = [2024, 31337, 8675309, 404, 777, 1, 42];
  const gapSets: Record<string, number[]> = {
    "tight (combo retained)": [120, 300, 90, 250],
    "slow (combo resets each move)": [3200, 4000, 5000],
    "boundary (reset races the swap anim)": [
      2000,
      2000 + Math.floor(SWAP_ANIM_MS / 2),
      2100,
      1950,
    ],
    mixed: [80, 2050, 600, 2200, 3000, 150],
  };

  for (const seed of seeds) {
    for (const [label, gaps] of Object.entries(gapSets)) {
      it(`seed ${seed} — ${label}: hook score === replay(log)`, () => {
        const live = playGame(seed, gaps);
        expect(live.actions.length).toBeGreaterThan(2);

        const rr = replay(seed, "normal", live.actions);

        expect(rr.invalid).toBe(false);
        expect(rr.score).toBe(live.score);
        expect(rr.hearts).toBe(live.hearts);
      });
    }
  }
});
