import { useCallback, useEffect, useRef, useState } from "react";
import {
  CLEAR_ANIM_MS,
  COMBO_MULT_STEP,
  COMBO_RESET_MS,
  FALL_ANIM_MS,
  GAME_DURATION_MS,
  GRID_COLS,
  GRID_ROWS,
  HINT_IDLE_MS,
  INITIAL_SPIRIT_CHARGE,
  NIGHT_ACTIVE_MS,
  SCORE_PER_HEART,
  SPIRIT_MAX,
  SWAP_ANIM_MS,
  TIMER_TICK_MS,
} from "~/shared/config/game-config";
import { Audition } from "~/shared/lib/audition";
import {
  createBoard,
  createTileFactory,
  isAdjacent,
  swapTiles,
  type TileFactory,
} from "~/shared/lib/board";
import { findFirstHintMove } from "~/shared/lib/matches";
import {
  applyChargeDeltas,
  applyUltEffect,
  type CascadeStep,
  computeCascadeSteps,
  type ReplayAction,
} from "@engine/engine";
import { createRng, type Rng } from "@engine/rng";
import type {
  GameState,
  Position,
  ScoreFlash,
  TileElement,
} from "~/shared/types/game";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInitialState(makeTile: TileFactory): GameState {
  return {
    board: createBoard(GRID_ROWS, GRID_COLS, makeTile),
    score: 0,
    timeLeft: GAME_DURATION_MS,
    timerStarted: false,
    combo: 0,
    lastMatchElement: null,
    consecutiveSameElement: 0,
    spiritCharge: { ...INITIAL_SPIRIT_CHARGE },
    hearts: 0,
    dragSource: null,
    isNight: false,
    phase: "idle",
    gameOverReason: "time",
    hintPositions: null,
    scoreFlash: null,
  };
}

function makeScoreFlash(step: CascadeStep, scoreDelta: number): ScoreFlash {
  return {
    delta: scoreDelta,
    row: step.matchedCentroid.row,
    col: step.matchedCentroid.col,
    id: Date.now() + Math.random(),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameState(
  zenMode = false,
  paused = false,
  seed = 1,
  gameId: string | null = null,
) {
  // Per-game deterministic context. The seeded RNG + tile factory are the same
  // ones the server replay will use, so the recorded action log fully
  // reproduces the game.
  const rngRef = useRef<Rng | null>(null);
  const makeTileRef = useRef<TileFactory | null>(null);
  if (!makeTileRef.current) {
    rngRef.current = createRng(seed);
    makeTileRef.current = createTileFactory(rngRef.current);
  }

  const [state, setState] = useState<GameState>(() =>
    makeInitialState(makeTileRef.current!),
  );
  const zenModeRef = useRef(zenMode);
  zenModeRef.current = zenMode;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const stateRef = useRef(state);
  stateRef.current = state;

  // Action log + game clock — `t` is ms of *active game time*, matching the
  // server's replay budget. It is anchored at the first action (when the
  // countdown timer starts) and excludes paused intervals (menus/chat), since
  // the in-game timer freezes during those too. Anchoring at hook mount or
  // counting paused time instead would inflate `t` past GAME_DURATION_MS and
  // trip the server's `timeline:over-budget` check on otherwise-legit runs.
  const seedRef = useRef(seed);
  const gameIdRef = useRef(gameId);
  gameIdRef.current = gameId;
  const actionLogRef = useRef<ReplayAction[]>([]);
  const perfNow = () =>
    typeof performance !== "undefined" ? performance.now() : Date.now();
  // Wall time of the first action (timer start); null until then.
  const timerEpochRef = useRef<number | null>(null);
  // Total paused ms accrued since the timer started, plus the start of the
  // pause currently in progress (if any).
  const pausedAccumRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  const nowT = useCallback(() => {
    const now = perfNow();
    if (timerEpochRef.current === null) {
      timerEpochRef.current = now; // first action anchors t = 0
      return 0;
    }
    const livePause =
      pauseStartRef.current !== null ? now - pauseStartRef.current : 0;
    return Math.round(
      now - timerEpochRef.current - pausedAccumRef.current - livePause,
    );
  }, []);
  // Active-game-time `t` at which the normal-mode countdown reaches 0. The
  // displayed timer is derived from this and `nowT()` rather than by
  // subtracting a fixed step per interval tick: setInterval fires late under
  // load/throttling, and a fixed decrement made the on-screen countdown run
  // slower than the wall clock the action log is stamped with — honest runs
  // played to the end then overshot the server's replay budget and were
  // flagged `timeline:over-budget`. Null until the first action starts the
  // timer; never set in zen mode.
  const deadlineTRef = useRef<number | null>(null);

  const cascadeStepsRef = useRef<CascadeStep[]>([]);
  const cascadeIdxRef = useRef(0);
  const queuedSwapRef = useRef<{ from: Position; to: Position } | null>(null);
  const prevHeartsRef = useRef(0);
  const idleMsRef = useRef(0);
  const comboResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const scheduleComboReset = useCallback(() => {
    if (comboResetTimeoutRef.current !== null) {
      clearTimeout(comboResetTimeoutRef.current);
    }
    comboResetTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, combo: 0 }));
      comboResetTimeoutRef.current = null;
    }, COMBO_RESET_MS);
  }, []);

  const startFreshGame = useCallback((nextSeed: number) => {
    if (comboResetTimeoutRef.current !== null) {
      clearTimeout(comboResetTimeoutRef.current);
      comboResetTimeoutRef.current = null;
    }
    rngRef.current = createRng(nextSeed);
    makeTileRef.current = createTileFactory(rngRef.current);
    cascadeStepsRef.current = [];
    cascadeIdxRef.current = 0;
    queuedSwapRef.current = null;
    actionLogRef.current = [];
    timerEpochRef.current = null;
    deadlineTRef.current = null;
    pausedAccumRef.current = 0;
    pauseStartRef.current = null;
    setState(makeInitialState(makeTileRef.current));
  }, []);

  // Track paused intervals so `nowT` can exclude them — but only once the
  // action clock has started (the timer doesn't run before the first move).
  useEffect(() => {
    if (paused) {
      if (timerEpochRef.current !== null && pauseStartRef.current === null) {
        pauseStartRef.current = perfNow();
      }
    } else if (pauseStartRef.current !== null) {
      pausedAccumRef.current += perfNow() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
  }, [paused]);

  // A new server-issued seed means a new game.
  useEffect(() => {
    if (seedRef.current === seed) return;
    seedRef.current = seed;
    startFreshGame(seed);
  }, [seed, startFreshGame]);

  useEffect(() => {
    if (state.hearts > prevHeartsRef.current) {
      Audition.heartCollected();
    }
    prevHeartsRef.current = state.hearts;
  }, [state.hearts]);

  useEffect(() => {
    if (state.phase === "clearing") {
      Audition.tilesMatched();
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.combo > 1) Audition.comboHappened(state.combo);
  }, [state.combo]);

  // ---------------------------------------------------------------------------
  // Night mode auto-revert
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!state.isNight) return;
    const id = setTimeout(() => {
      setState((prev) => ({ ...prev, isNight: false }));
    }, NIGHT_ACTIVE_MS);
    return () => clearTimeout(id);
  }, [state.isNight]);

  // ---------------------------------------------------------------------------
  // Countdown timer — ticks every 100 ms while game is active
  // ---------------------------------------------------------------------------

  const isGameOver = state.phase === "gameOver";
  useEffect(() => {
    if (isGameOver) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.phase === "gameOver") return prev;
        if (pausedRef.current) return prev;
        if (!prev.timerStarted) return prev;

        const isZen = zenModeRef.current;
        let newTime = prev.timeLeft;
        if (!isZen) {
          if (deadlineTRef.current === null) return prev;
          newTime = deadlineTRef.current - nowT();
          if (newTime <= 0)
            return {
              ...prev,
              timeLeft: 0,
              phase: "gameOver",
              gameOverReason: "time",
            };
        }

        if (prev.phase === "idle" && prev.hintPositions === null) {
          idleMsRef.current += TIMER_TICK_MS;
          if (idleMsRef.current >= HINT_IDLE_MS) {
            const hint = findFirstHintMove(prev.board);
            if (hint) {
              idleMsRef.current = 0;
              return { ...prev, timeLeft: newTime, hintPositions: hint };
            }
          }
        }

        return { ...prev, timeLeft: newTime };
      });
    }, TIMER_TICK_MS);
    return () => clearInterval(id);
  }, [isGameOver, nowT]);

  useEffect(() => {
    idleMsRef.current = 0;
    if (state.phase !== "idle") {
      setState((prev) =>
        prev.hintPositions !== null ? { ...prev, hintPositions: null } : prev,
      );
    }
  }, [state.phase]);

  // Drain queued swap (set while a prior cascade was animating) on idle
  useEffect(() => {
    if (state.phase === "idle" && queuedSwapRef.current) {
      const { from, to } = queuedSwapRef.current;
      queuedSwapRef.current = null;
      swipeSwap(from, to);
    }
  }, [state.phase]);

  // ---------------------------------------------------------------------------
  // Phase-driven animation sequencing
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (state.phase === "swapping") {
      const id = setTimeout(() => {
        const steps = cascadeStepsRef.current;
        if (steps.length === 0) {
          setState((prev) => ({ ...prev, phase: "idle" }));
          return;
        }
        setState((prev) => {
          const newCombo = prev.combo + 1;
          const comboMult = 1 + COMBO_MULT_STEP * (newCombo - 1);
          const scoreDelta = Math.round(steps[0].baseScoreDelta * comboMult);
          return {
            ...prev,
            board: steps[0].clearedBoard,
            combo: newCombo,
            scoreFlash: makeScoreFlash(
              steps[0],
              scoreDelta + steps[0].heartsDelta * SCORE_PER_HEART,
            ),
            phase: "clearing",
          };
        });
        scheduleComboReset();
      }, SWAP_ANIM_MS);
      return () => clearTimeout(id);
    }

    if (state.phase === "clearing") {
      const id = setTimeout(() => {
        const step = cascadeStepsRef.current[cascadeIdxRef.current];
        setState((prev) => {
          const comboMult = 1 + COMBO_MULT_STEP * (prev.combo - 1);
          return {
            ...prev,
            board: step.filledBoard,
            score:
              prev.score +
              Math.round(step.baseScoreDelta * comboMult) +
              step.heartsDelta * SCORE_PER_HEART,
            hearts: prev.hearts + step.heartsDelta,
            spiritCharge: applyChargeDeltas(
              prev.spiritCharge,
              step.spiritDelta,
            ),
            lastMatchElement: step.lastMatchElement,
            consecutiveSameElement: step.consecutiveSameElement,
            phase: "falling",
          };
        });
      }, CLEAR_ANIM_MS);
      return () => clearTimeout(id);
    }

    if (state.phase === "falling") {
      const id = setTimeout(() => {
        const steps = cascadeStepsRef.current;
        const nextIdx = cascadeIdxRef.current + 1;

        if (nextIdx < steps.length) {
          cascadeIdxRef.current = nextIdx;
          setState((prev) => {
            const newCombo = prev.combo + 1;
            const comboMult = 1 + COMBO_MULT_STEP * (newCombo - 1);
            const scoreDelta = Math.round(
              steps[nextIdx].baseScoreDelta * comboMult,
            );
            return {
              ...prev,
              board: steps[nextIdx].clearedBoard,
              combo: newCombo,
              scoreFlash: makeScoreFlash(
                steps[nextIdx],
                scoreDelta + steps[nextIdx].heartsDelta * SCORE_PER_HEART,
              ),
              phase: "clearing",
            };
          });
          scheduleComboReset();
        } else {
          const lastStep = steps[cascadeIdxRef.current];
          if (lastStep?.deadlocked) {
            setState((prev) => ({
              ...prev,
              phase: "gameOver",
              gameOverReason: "deadlock",
            }));
          } else {
            setState((prev) => ({ ...prev, phase: "idle" }));
          }
        }
      }, FALL_ANIM_MS);
      return () => clearTimeout(id);
    }
  }, [state.phase, scheduleComboReset]);

  // ---------------------------------------------------------------------------
  // swipeSwap / setDragSource
  // ---------------------------------------------------------------------------

  const setDragSource = useCallback((pos: Position | null) => {
    if (pausedRef.current) return;
    idleMsRef.current = 0;
    setState((prev) => ({ ...prev, dragSource: pos, hintPositions: null }));
  }, []);

  const swipeSwap = useCallback((from: Position, to: Position) => {
    if (pausedRef.current) return;
    const s = stateRef.current;
    if (!isAdjacent(from, to)) return;

    if (s.phase !== "idle") {
      const steps = cascadeStepsRef.current;
      if (steps.length === 0) return;
      const finalBoard = steps[steps.length - 1].filledBoard;
      const fromTile = s.board[from.row]?.[from.col];
      const toTile = s.board[to.row]?.[to.col];
      const fromFinal = finalBoard[from.row]?.[from.col];
      const toFinal = finalBoard[to.row]?.[to.col];
      if (
        fromTile &&
        toTile &&
        fromFinal &&
        toFinal &&
        fromTile.tileId === fromFinal.tileId &&
        toTile.tileId === toFinal.tileId
      ) {
        queuedSwapRef.current = { from, to };
      }
      return;
    }

    const swapped = swapTiles(s.board, from, to);
    const steps = computeCascadeSteps(
      swapped,
      s.lastMatchElement,
      s.consecutiveSameElement,
      makeTileRef.current!,
      zenModeRef.current,
    );

    if (steps.length === 0) {
      Audition.tilesNotMatched();
      return;
    }

    const t = nowT();
    if (!zenModeRef.current) {
      if (deadlineTRef.current === null) {
        deadlineTRef.current = t + GAME_DURATION_MS;
      } else if (t >= deadlineTRef.current) {
        // Countdown expired but the game-over tick hasn't fired yet (interval
        // ticks can land late). Logging this action would put it past the
        // server's replay budget, so drop it.
        return;
      }
    }

    Audition.tileSwiped();
    actionLogRef.current.push({ t, type: "swap", from, to });
    cascadeStepsRef.current = steps;
    cascadeIdxRef.current = 0;

    setState((prev) => ({
      ...prev,
      board: swapped,
      dragSource: null,
      hintPositions: null,
      timerStarted: true,
      phase: "swapping",
    }));
  }, [nowT]);

  // ---------------------------------------------------------------------------
  // activateUlt
  // ---------------------------------------------------------------------------

  const activateUlt = useCallback(
    (element: TileElement) => {
      if (pausedRef.current) return;
      const s = stateRef.current;
      if (s.phase !== "idle") return;
      if (s.spiritCharge[element] < SPIRIT_MAX) return;

      const t = nowT();
      // Derive the remaining time from the deadline (exact) rather than the
      // state's timeLeft (stale by up to one tick), so the night bonus and the
      // updated deadline stay on the action-log clock.
      let timeLeftNow = s.timeLeft;
      if (!zenModeRef.current) {
        if (deadlineTRef.current === null) {
          deadlineTRef.current = t + GAME_DURATION_MS;
        } else if (t >= deadlineTRef.current) {
          // Countdown expired but the game-over tick hasn't fired yet; drop
          // the action instead of logging it past the server's replay budget.
          return;
        }
        timeLeftNow = deadlineTRef.current - t;
      }

      const newCharge = { ...s.spiritCharge, [element]: 0 };
      if (element === "electric") Audition.electricUlt();

      const eff = applyUltEffect(
        element,
        s.board,
        s.isNight,
        timeLeftNow,
        makeTileRef.current!,
        rngRef.current!,
        zenModeRef.current,
      );
      if (!zenModeRef.current) deadlineTRef.current = t + eff.timeLeft;

      const steps = computeCascadeSteps(
        eff.board,
        s.lastMatchElement,
        s.consecutiveSameElement,
        makeTileRef.current!,
        zenModeRef.current,
      );

      actionLogRef.current.push({ t, type: "ult", element });

      if (steps.length > 0) {
        cascadeStepsRef.current = steps;
        cascadeIdxRef.current = 0;

        setState((prev) => {
          const newCombo = prev.combo + 1;
          const comboMult = 1 + COMBO_MULT_STEP * (newCombo - 1);
          const scoreDelta = Math.round(steps[0].baseScoreDelta * comboMult);
          return {
            ...prev,
            board: steps[0].clearedBoard,
            spiritCharge: newCharge,
            score: prev.score + scoreDelta + eff.heartsDelta * SCORE_PER_HEART,
            hearts: prev.hearts + eff.heartsDelta,
            isNight: eff.isNight,
            timeLeft: eff.timeLeft,
            timerStarted: true,
            combo: newCombo,
            scoreFlash: makeScoreFlash(
              steps[0],
              scoreDelta + eff.heartsDelta * SCORE_PER_HEART,
            ),
            phase: "clearing",
          };
        });
        scheduleComboReset();
      } else if (eff.deadlocked) {
        setState((prev) => ({
          ...prev,
          board: eff.board,
          spiritCharge: newCharge,
          score: prev.score + eff.heartsDelta * SCORE_PER_HEART,
          hearts: prev.hearts + eff.heartsDelta,
          isNight: eff.isNight,
          timeLeft: eff.timeLeft,
          timerStarted: true,
          phase: "gameOver",
          gameOverReason: "deadlock",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          board: eff.board,
          spiritCharge: newCharge,
          score: prev.score + eff.heartsDelta * SCORE_PER_HEART,
          hearts: prev.hearts + eff.heartsDelta,
          isNight: eff.isNight,
          timeLeft: eff.timeLeft,
          timerStarted: true,
          phase: "idle",
        }));
      }
    },
    [nowT, scheduleComboReset],
  );

  // ---------------------------------------------------------------------------
  // resetGame
  // ---------------------------------------------------------------------------

  const resetGame = useCallback(() => {
    startFreshGame(seedRef.current);
  }, [startFreshGame]);

  return {
    state,
    swipeSwap,
    setDragSource,
    activateUlt,
    resetGame,
    gameId: gameIdRef.current,
    getActionLog: useCallback(() => actionLogRef.current.slice(), []),
  };
}
