import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CLEAR_ANIM_MS,
  FALL_ANIM_MS,
  GAME_DURATION_MS,
  SWAP_ANIM_MS,
} from "@engine/config";
import { replay, type ReplayAction } from "@engine/engine";
import { findFirstHintMove } from "@engine/matches";
import { useGameState } from "../use-game-state";

// Regression guard for false `timeline:over-budget` bans. The recorded action
// `t` must be *active game time* — anchored at the first move and excluding
// paused intervals (menus/chat) — because that is what the server's replay
// budget measures. When `t` was wall-clock-from-mount, pre-game idle and mid-
// game pauses inflated every timestamp past GAME_DURATION_MS and flagged
// otherwise-legit runs. See use-game-state.ts `nowT`.
vi.mock("~/shared/lib/audition", () => ({
  Audition: new Proxy({}, { get: () => () => {} }),
}));

beforeEach(() => {
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

// Plays one hinted swap and animates its full cascade to completion, exactly
// as the parity test does — the countdown then only consumes the real lock.
function playHintedMove(result: { current: Hook }): boolean {
  // Read phase via a call so the early-return narrowing below does not leak
  // into the cascade comparisons in the loop.
  const phaseOf = () => result.current.state.phase;
  if (phaseOf() !== "idle") return false;
  const hint = findFirstHintMove(result.current.state.board);
  if (!hint) return false;

  act(() => result.current.swipeSwap(hint[0], hint[1]));
  act(() => vi.advanceTimersByTime(SWAP_ANIM_MS));
  let guard = 0;
  while (
    (phaseOf() === "clearing" || phaseOf() === "falling") &&
    guard++ < 200
  ) {
    act(() => vi.advanceTimersByTime(CLEAR_ANIM_MS));
    act(() => vi.advanceTimersByTime(FALL_ANIM_MS));
  }
  return true;
}

describe("action clock excludes non-game time", () => {
  const seed = 31337;

  it("pre-game idle does not inflate timestamps — first action is t=0", () => {
    // Mount paused (menu / game-not-started), sit there a long while, then
    // start playing. The first move must anchor t=0 regardless of the wait.
    const { result, rerender } = renderHook(
      ({ paused }) => useGameState(false, paused, seed, "game-1"),
      { initialProps: { paused: true } },
    );

    act(() => vi.advanceTimersByTime(45_000)); // 45s sitting in the menu
    rerender({ paused: false });

    expect(playHintedMove(result)).toBe(true);

    const actions = result.current.getActionLog() as ReplayAction[];
    expect(actions[0]?.t).toBe(0);
  });

  it("a mid-game pause is excluded from the action clock", () => {
    const { result, rerender } = renderHook(
      ({ paused }) => useGameState(false, paused, seed, "game-1"),
      { initialProps: { paused: false } },
    );

    expect(playHintedMove(result)).toBe(true);
    expect(playHintedMove(result)).toBe(true);

    const log = () => result.current.getActionLog() as ReplayAction[];
    const tBeforePause = log()[log().length - 1]!.t;

    // Open a menu mid-game: pause, leave it open 40s, resume.
    rerender({ paused: true });
    act(() => vi.advanceTimersByTime(40_000));
    rerender({ paused: false });

    expect(playHintedMove(result)).toBe(true);
    const tAfterPause = log()[log().length - 1]!.t;

    // The 40s pause must NOT appear in the gap between the two moves; only the
    // animation lock of the move bridging the pause should.
    expect(tAfterPause - tBeforePause).toBeLessThan(10_000);
  });

  it("a slow run with long menu pauses is not flagged over-budget", () => {
    const { result, rerender } = renderHook(
      ({ paused }) => useGameState(false, paused, seed, "game-1"),
      { initialProps: { paused: true } },
    );

    // 30s in the menu before starting...
    act(() => vi.advanceTimersByTime(30_000));
    rerender({ paused: false });

    for (let i = 0; i < 10; i++) {
      if (!playHintedMove(result)) break;
      // ...a pondering gap between moves...
      act(() => vi.advanceTimersByTime(3_000));
      // ...and a 20s menu pause halfway through.
      if (i === 4) {
        rerender({ paused: true });
        act(() => vi.advanceTimersByTime(20_000));
        rerender({ paused: false });
      }
    }

    const actions = result.current.getActionLog() as ReplayAction[];
    expect(actions.length).toBeGreaterThan(2);

    const lastT = actions[actions.length - 1]!.t;
    // Real elapsed was 30s + 20s of menus on top of play, but active game time
    // stays well within budget, so the server must not flag the run.
    expect(lastT).toBeLessThanOrEqual(GAME_DURATION_MS);

    const rr = replay(seed, "normal", actions);
    expect(rr.timelineInvalid).toBe(false);
    expect(rr.invalid).toBe(false);
  });
});
