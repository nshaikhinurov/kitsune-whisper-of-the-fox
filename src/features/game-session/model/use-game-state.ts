import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHAOTIC_PATCH_SIZE,
  CLEAR_ANIM_MS,
  COMBO_MULT_STEP,
  COMBO_RESET_MS,
  ELEMENTS,
  FALL_ANIM_MS,
  GAME_DURATION_MS,
  GRID_COLS,
  GRID_ROWS,
  HINT_IDLE_MS,
  INITIAL_SPIRIT_CHARGE,
  NIGHT_ACTIVE_MS,
  NIGHT_TIME_BONUS_MS,
  RED_MIN_TILES,
  RED_TILE_VARIANCE,
  SAKURA_MIN_HEARTS,
  SAKURA_HEART_VARIANCE,
  SCORE_PER_HEART,
  SPIRIT_CHARGE_PER_MATCH,
  SPIRIT_MAX,
  SWAP_ANIM_MS,
  TIMER_TICK_MS,
  WHITE_MIN_TILES,
  WHITE_TILE_VARIANCE,
} from "~/shared/config/game-config";
import { Audition } from "~/shared/lib/audition";
import {
  applyGravity,
  createBoard,
  isAdjacent,
  pickRandomNonNullCells,
  refillBoard,
  shuffleRegion,
  swapTiles,
} from "~/shared/lib/board";
import {
  findFirstHintMove,
  findMatches,
  parseKey,
  positionsToSet,
  posKey,
} from "~/shared/lib/matches";
import type {
  CellState,
  GameState,
  Position,
  ScoreFlash,
  SpiritCharge,
  TileElement,
} from "~/shared/types/game";

// ---------------------------------------------------------------------------
// Cascade step — one iteration of: clear matches → gravity → refill
// ---------------------------------------------------------------------------

interface CascadeStep {
  clearedBoard: CellState[][]; // board with matched tiles set to null  (drives exit anims)
  filledBoard: CellState[][]; // board after gravity + refill          (drives fall/entry anims)
  baseScoreDelta: number; // unmodified score; combo mult applied at display time
  heartsDelta: number;
  spiritDelta: Partial<Record<TileElement, number>>;
  lastMatchElement: TileElement | null;
  consecutiveSameElement: number;
  lastElectricCol: number;
  matchedCentroid: { row: number; col: number };
  deadlocked?: boolean;
}

function computeCascadeSteps(
  initialBoard: CellState[][],
  startLastElement: TileElement | null,
  startConsecutive: number,
  startElectricCol: number,
  zenMode = false,
): CascadeStep[] {
  const steps: CascadeStep[] = [];
  let board = initialBoard;
  let lastMatchElement = startLastElement;
  let consecutiveSameElement = startConsecutive;
  let lastElectricCol = startElectricCol;

  while (true) {
    const matches = findMatches(board);
    if (matches.length === 0) break;

    // Dominant element for spirit charging
    const elementCounts: Partial<Record<TileElement, number>> = {};
    for (const match of matches) {
      elementCounts[match.element] =
        (elementCounts[match.element] ?? 0) + match.positions.length;
    }
    const dominant = Object.entries(elementCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0] as TileElement;

    if (dominant === lastMatchElement) {
      consecutiveSameElement++;
    } else {
      consecutiveSameElement = 1;
      lastMatchElement = dominant;
    }

    const matchedSet = positionsToSet(matches);
    let baseScoreDelta = 0;
    let heartsDelta = 0;
    const spiritDelta: Partial<Record<TileElement, number>> = {};

    for (const match of matches) {
      const n = match.positions.length;
      baseScoreDelta += 2 * n * (n + 2);
      const chargeBonus =
        match.element === lastMatchElement
          ? SPIRIT_CHARGE_PER_MATCH * consecutiveSameElement
          : SPIRIT_CHARGE_PER_MATCH;
      spiritDelta[match.element] =
        (spiritDelta[match.element] ?? 0) + chargeBonus;
    }

    for (const key of matchedSet) {
      const { row, col } = parseKey(key);
      const tile = board[row][col];
      if (tile?.hasHeart) heartsDelta++;
      if (tile?.element === "electric") lastElectricCol = col;
    }

    const matchedPositions = [...matchedSet].map(parseKey);
    const matchedCentroid = {
      row:
        matchedPositions.reduce((s, p) => s + p.row, 0) /
        matchedPositions.length,
      col:
        matchedPositions.reduce((s, p) => s + p.col, 0) /
        matchedPositions.length,
    };

    const clearedBoard = board.map((row, r) =>
      row.map((cell, c) =>
        matchedSet.has(posKey({ row: r, col: c })) ? null : cell,
      ),
    );
    const { board: filledBoard, deadlocked } = refillBoard(
      applyGravity(clearedBoard),
      GRID_ROWS,
      GRID_COLS,
      zenMode,
    );

    steps.push({
      clearedBoard,
      filledBoard,
      baseScoreDelta,
      heartsDelta,
      spiritDelta,
      lastMatchElement,
      consecutiveSameElement,
      lastElectricCol,
      matchedCentroid,
      deadlocked,
    });

    if (deadlocked) break;
    board = filledBoard;
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInitialState(): GameState {
  return {
    board: createBoard(GRID_ROWS, GRID_COLS),
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
    lastElectricCol: 0,
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

function applyChargeDeltas(
  current: SpiritCharge,
  deltas: Partial<Record<TileElement, number>>,
): SpiritCharge {
  const next = { ...current };
  for (const el of ELEMENTS) {
    next[el] = Math.min(SPIRIT_MAX, next[el] + (deltas[el] ?? 0));
  }
  return next;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGameState(zenMode = false, paused = false) {
  const [state, setState] = useState<GameState>(makeInitialState);
  const zenModeRef = useRef(zenMode);
  zenModeRef.current = zenMode;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Stable ref so callbacks always read fresh state without stale closures
  const stateRef = useRef(state);
  stateRef.current = state;

  // Cascade queue — not in state since changes don't need re-renders
  const cascadeStepsRef = useRef<CascadeStep[]>([]);
  const cascadeIdxRef = useRef(0);
  const queuedSwapRef = useRef<{ from: Position; to: Position } | null>(null);
  const prevHeartsRef = useRef(0);
  const idleMsRef = useRef(0);
  const comboResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Cancels any pending combo-reset and starts a fresh 2-second window.
  const scheduleComboReset = useCallback(() => {
    if (comboResetTimeoutRef.current !== null) {
      clearTimeout(comboResetTimeoutRef.current);
    }
    comboResetTimeoutRef.current = setTimeout(() => {
      setState((prev) => ({ ...prev, combo: 0 }));
      comboResetTimeoutRef.current = null;
    }, COMBO_RESET_MS);
  }, []);

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
        const newTime = isZen ? prev.timeLeft : prev.timeLeft - TIMER_TICK_MS;
        if (!isZen && newTime <= 0)
          return {
            ...prev,
            timeLeft: 0,
            phase: "gameOver",
            gameOverReason: "time",
          };

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
  }, [isGameOver]);

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
  //
  // "swapping"  → wait SWAP_ANIM_MS  → show clearedBoard[0]  → "clearing"
  // "clearing"  → wait CLEAR_ANIM_MS → show filledBoard[i]   → "falling"
  // "falling"   → wait FALL_ANIM_MS  → next step or finish   → "clearing" | "idle" | "gameOver"
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
            lastElectricCol: step.lastElectricCol,
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
          // More cascade steps — advance to next clear
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
          // Cascade fully done
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
  }, [state.phase]);

  // ---------------------------------------------------------------------------
  // swipeSwap / setDragSource
  // ---------------------------------------------------------------------------

  const setDragSource = useCallback((pos: Position | null) => {
    idleMsRef.current = 0;
    setState((prev) => ({ ...prev, dragSource: pos, hintPositions: null }));
  }, []);

  const swipeSwap = useCallback((from: Position, to: Position) => {
    const s = stateRef.current;
    if (!isAdjacent(from, to)) return;

    if (s.phase !== "idle") {
      // Allow swiping tiles that won't move for the remainder of the current
      // cascade. A cell is "frozen" iff its tileId in the currently displayed
      // board matches its tileId in the final post-cascade board.
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
      s.lastElectricCol,
      zenModeRef.current,
    );

    if (steps.length === 0) {
      Audition.tilesNotMatched();
      return;
    }

    Audition.tileSwiped();
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
  }, []);

  // ---------------------------------------------------------------------------
  // activateUlt
  // ---------------------------------------------------------------------------

  const activateUlt = useCallback(
    (element: TileElement) => {
      const s = stateRef.current;
      if (s.phase !== "idle") return;
      if (s.spiritCharge[element] < SPIRIT_MAX) return;

      const newCharge = { ...s.spiritCharge, [element]: 0 };
      let board = s.board.map((row) => [...row]);
      let heartsDelta = 0;
      let isNight = s.isNight;
      let timeLeft = s.timeLeft;
      let ultDeadlocked = false;

      switch (element) {
        // Randomly re-rolls the element of N board tiles
        case "ori": {
          const count =
            WHITE_MIN_TILES + Math.floor(Math.random() * WHITE_TILE_VARIANCE);
          for (const { row, col } of pickRandomNonNullCells(board, count)) {
            const tile = board[row][col];
            if (tile)
              board[row][col] = {
                ...tile,
                element: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
              };
          }
          break;
        }
        // Clears N random tiles and refills the board
        case "green": {
          const count =
            RED_MIN_TILES + Math.floor(Math.random() * RED_TILE_VARIANCE);
          for (const { row, col } of pickRandomNonNullCells(board, count)) {
            if (board[row][col]?.hasHeart) heartsDelta++;
            board[row][col] = null;
          }
          ({ board, deadlocked: ultDeadlocked } = refillBoard(
            applyGravity(board),
            GRID_ROWS,
            GRID_COLS,
            zenModeRef.current,
          ));
          break;
        }
        // Wipes a random column and refills
        case "electric": {
          Audition.electricUlt();
          const col = Math.floor(Math.random() * GRID_COLS);
          for (let r = 0; r < GRID_ROWS; r++) {
            if (board[r][col]?.hasHeart) heartsDelta++;
            board[r][col] = null;
          }
          ({ board, deadlocked: ultDeadlocked } = refillBoard(
            applyGravity(board),
            GRID_ROWS,
            GRID_COLS,
            zenModeRef.current,
          ));
          break;
        }
        // Shuffles tiles inside a randomly placed NxN patch
        case "chaotic": {
          const startRow = Math.floor(
            Math.random() * (GRID_ROWS - CHAOTIC_PATCH_SIZE + 1),
          );
          const startCol = Math.floor(
            Math.random() * (GRID_COLS - CHAOTIC_PATCH_SIZE + 1),
          );
          const positions: Position[] = [];
          for (let r = startRow; r < startRow + CHAOTIC_PATCH_SIZE; r++)
            for (let c = startCol; c < startCol + CHAOTIC_PATCH_SIZE; c++)
              positions.push({ row: r, col: c });
          board = shuffleRegion(board, positions);
          break;
        }
        // Activates night theme and adds bonus time, capped at the game limit
        case "night": {
          isNight = true;
          timeLeft = Math.min(timeLeft + NIGHT_TIME_BONUS_MS, GAME_DURATION_MS);
          break;
        }
        // Collects N random hearted tiles and strips their heart (scoring them)
        case "sakura": {
          const heartPositions: Position[] = [];
          for (let r = 0; r < GRID_ROWS; r++)
            for (let c = 0; c < GRID_COLS; c++)
              if (board[r][c]?.hasHeart) heartPositions.push({ row: r, col: c });
          const count = Math.min(
            SAKURA_MIN_HEARTS + Math.floor(Math.random() * SAKURA_HEART_VARIANCE),
            heartPositions.length,
          );
          // Partial Fisher-Yates: j drawn from [i, length) keeps selection uniform
          for (let i = 0; i < count; i++) {
            const j =
              i + Math.floor(Math.random() * (heartPositions.length - i));
            [heartPositions[i], heartPositions[j]] = [
              heartPositions[j],
              heartPositions[i],
            ];
          }
          for (let i = 0; i < count; i++) {
            const { row, col } = heartPositions[i];
            heartsDelta++;
            board[row][col] = { ...board[row][col]!, hasHeart: false };
          }
          // Spawn fresh hearts on heartless tiles using the same range
          const heartlessPositions: Position[] = [];
          for (let r = 0; r < GRID_ROWS; r++)
            for (let c = 0; c < GRID_COLS; c++)
              if (board[r][c] && !board[r][c]!.hasHeart)
                heartlessPositions.push({ row: r, col: c });
          const spawnCount = Math.min(
            SAKURA_MIN_HEARTS + Math.floor(Math.random() * SAKURA_HEART_VARIANCE),
            heartlessPositions.length,
          );
          for (let i = 0; i < spawnCount; i++) {
            const j =
              i + Math.floor(Math.random() * (heartlessPositions.length - i));
            [heartlessPositions[i], heartlessPositions[j]] = [
              heartlessPositions[j],
              heartlessPositions[i],
            ];
          }
          for (let i = 0; i < spawnCount; i++) {
            const { row, col } = heartlessPositions[i];
            board[row][col] = { ...board[row][col]!, hasHeart: true };
          }
          break;
        }
      }

      const steps = computeCascadeSteps(
        board,
        s.lastMatchElement,
        s.consecutiveSameElement,
        s.lastElectricCol,
        zenModeRef.current,
      );

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
            score: prev.score + scoreDelta + heartsDelta * SCORE_PER_HEART,
            hearts: prev.hearts + heartsDelta,
            isNight,
            timeLeft,
            timerStarted: true,
            combo: newCombo,
            scoreFlash: makeScoreFlash(
              steps[0],
              scoreDelta + heartsDelta * SCORE_PER_HEART,
            ),
            phase: "clearing",
          };
        });
        scheduleComboReset();
      } else if (ultDeadlocked) {
        setState((prev) => ({
          ...prev,
          board,
          spiritCharge: newCharge,
          score: prev.score + heartsDelta * SCORE_PER_HEART,
          hearts: prev.hearts + heartsDelta,
          isNight,
          timeLeft,
          timerStarted: true,
          phase: "gameOver",
          gameOverReason: "deadlock",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          board,
          spiritCharge: newCharge,
          score: prev.score + heartsDelta * SCORE_PER_HEART,
          hearts: prev.hearts + heartsDelta,
          isNight,
          timeLeft,
          timerStarted: true,
          phase: "idle",
        }));
      }
    },
    [scheduleComboReset],
  );

  // ---------------------------------------------------------------------------
  // resetGame
  // ---------------------------------------------------------------------------

  const resetGame = useCallback(() => {
    if (comboResetTimeoutRef.current !== null) {
      clearTimeout(comboResetTimeoutRef.current);
      comboResetTimeoutRef.current = null;
    }
    cascadeStepsRef.current = [];
    cascadeIdxRef.current = 0;
    queuedSwapRef.current = null;
    setState(makeInitialState());
  }, []);

  return { state, swipeSwap, setDragSource, activateUlt, resetGame };
}
