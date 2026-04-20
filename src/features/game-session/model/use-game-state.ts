import { useCallback, useEffect, useRef, useState } from "react";
import {
  CHAOTIC_PATCH_SIZE,
  CLEAR_ANIM_MS,
  COMBO_MULT_STEP,
  ELEMENTS,
  FALL_ANIM_MS,
  GAME_DURATION_MS,
  GRID_COLS,
  GRID_ROWS,
  INITIAL_SPIRIT_CHARGE,
  NIGHT_FOX_ACTIVE_MS,
  NIGHT_FOX_TIME_BONUS_MS,
  RED_FOX_MIN_TILES,
  RED_FOX_TILE_VARIANCE,
  SAKURA_GEM_VARIANCE,
  SAKURA_MIN_GEMS,
  SCORE_PER_TILE,
  SPIRIT_CHARGE_PER_MATCH,
  SPIRIT_MAX,
  SWAP_ANIM_MS,
  TIMER_TICK_MS,
  WHITE_FOX_MIN_TILES,
  WHITE_FOX_TILE_VARIANCE,
} from "../../../shared/config/game-config";
import {
  applyGravity,
  createBoard,
  isAdjacent,
  refillBoard,
  shuffleRegion,
  swapTiles,
} from "../../../shared/lib/board";
import { findMatches, positionsToSet } from "../../../shared/lib/matches";
import type {
  CellState,
  FoxElement,
  GameState,
  Position,
  SpiritCharge,
} from "../../../shared/types/game";

// ---------------------------------------------------------------------------
// Cascade step — one iteration of: clear matches → gravity → refill
// ---------------------------------------------------------------------------

interface CascadeStep {
  clearedBoard: CellState[][]; // board with matched tiles set to null  (drives exit anims)
  filledBoard: CellState[][]; // board after gravity + refill          (drives fall/entry anims)
  scoreDelta: number;
  gemsDelta: number;
  spiritDelta: Partial<Record<FoxElement, number>>;
  combo: number;
  lastMatchElement: FoxElement | null;
  consecutiveSameElement: number;
  lastElectricCol: number;
}

function computeCascadeSteps(
  initialBoard: CellState[][],
  startCombo: number,
  startLastElement: FoxElement | null,
  startConsecutive: number,
  startElectricCol: number,
): CascadeStep[] {
  const steps: CascadeStep[] = [];
  let board = initialBoard;
  let combo = startCombo;
  let lastMatchElement = startLastElement;
  let consecutiveSameElement = startConsecutive;
  let lastElectricCol = startElectricCol;

  while (true) {
    const matches = findMatches(board);
    if (matches.length === 0) break;

    combo++;

    // Dominant element for spirit charging
    const elementCounts: Partial<Record<FoxElement, number>> = {};
    for (const match of matches) {
      elementCounts[match.element] =
        (elementCounts[match.element] ?? 0) + match.positions.length;
    }
    const dominant = Object.entries(elementCounts).sort(
      (a, b) => b[1] - a[1],
    )[0][0] as FoxElement;

    if (dominant === lastMatchElement) {
      consecutiveSameElement++;
    } else {
      consecutiveSameElement = 1;
      lastMatchElement = dominant;
    }

    const matchedSet = positionsToSet(matches);
    const comboMult = 1 + COMBO_MULT_STEP * (combo - 1);
    let scoreDelta = 0;
    let gemsDelta = 0;
    const spiritDelta: Partial<Record<FoxElement, number>> = {};

    for (const match of matches) {
      scoreDelta += match.positions.length * SCORE_PER_TILE * comboMult;
      const chargeBonus =
        match.element === lastMatchElement
          ? SPIRIT_CHARGE_PER_MATCH * consecutiveSameElement
          : SPIRIT_CHARGE_PER_MATCH;
      spiritDelta[match.element] =
        (spiritDelta[match.element] ?? 0) + chargeBonus;
    }

    for (const key of matchedSet) {
      const [r, c] = key.split(",").map(Number);
      const tile = board[r][c];
      if (tile?.hasGem) gemsDelta++;
      if (tile?.element === "electric") lastElectricCol = c;
    }

    const clearedBoard = board.map((row, r) =>
      row.map((cell, c) => (matchedSet.has(`${r},${c}`) ? null : cell)),
    );
    const filledBoard = refillBoard(
      applyGravity(clearedBoard),
      GRID_ROWS,
      GRID_COLS,
    );

    steps.push({
      clearedBoard,
      filledBoard,
      scoreDelta: Math.round(scoreDelta),
      gemsDelta,
      spiritDelta,
      combo,
      lastMatchElement,
      consecutiveSameElement,
      lastElectricCol,
    });

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
    level: 1,
    combo: 0,
    lastMatchElement: null,
    consecutiveSameElement: 0,
    spiritCharge: { ...INITIAL_SPIRIT_CHARGE },
    gems: 0,
    selected: null,
    isDarkTheme: false,
    isTimeSlow: false,
    phase: "idle",
    lastElectricCol: 0,
  };
}

function applyChargeDeltas(
  current: SpiritCharge,
  deltas: Partial<Record<FoxElement, number>>,
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

export function useGameState() {
  const [state, setState] = useState<GameState>(makeInitialState);

  // Stable ref so callbacks always read fresh state without stale closures
  const stateRef = useRef(state);
  stateRef.current = state;

  // Cascade queue — not in state since changes don't need re-renders
  const cascadeStepsRef = useRef<CascadeStep[]>([]);
  const cascadeIdxRef = useRef(0);
  const prevGemsRef = useRef(0);

  useEffect(() => {
    if (state.gems > prevGemsRef.current) {
      new Audio("/diamond_obtained.mp3").play().catch(() => {});
    }
    prevGemsRef.current = state.gems;
  }, [state.gems]);

  // ---------------------------------------------------------------------------
  // Night Fox auto-revert
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!state.isTimeSlow) return;
    const id = setTimeout(() => {
      setState((prev) => ({ ...prev, isDarkTheme: false, isTimeSlow: false }));
    }, NIGHT_FOX_ACTIVE_MS);
    return () => clearTimeout(id);
  }, [state.isTimeSlow]);

  // ---------------------------------------------------------------------------
  // Countdown timer — ticks every 100 ms while game is active
  // ---------------------------------------------------------------------------

  const isGameOver = state.phase === "gameOver";
  useEffect(() => {
    if (isGameOver) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.phase === "gameOver") return prev;
        const newTime = prev.timeLeft - TIMER_TICK_MS;
        if (newTime <= 0) return { ...prev, timeLeft: 0, phase: "gameOver" };
        return { ...prev, timeLeft: newTime };
      });
    }, TIMER_TICK_MS);
    return () => clearInterval(id);
  }, [isGameOver]);

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
        setState((prev) => ({
          ...prev,
          board: steps[0].clearedBoard,
          combo: steps[0].combo,
          phase: "clearing",
        }));
      }, SWAP_ANIM_MS);
      return () => clearTimeout(id);
    }

    if (state.phase === "clearing") {
      const id = setTimeout(() => {
        const step = cascadeStepsRef.current[cascadeIdxRef.current];
        setState((prev) => ({
          ...prev,
          board: step.filledBoard,
          score: prev.score + step.scoreDelta,
          gems: prev.gems + step.gemsDelta,
          spiritCharge: applyChargeDeltas(prev.spiritCharge, step.spiritDelta),
          lastMatchElement: step.lastMatchElement,
          consecutiveSameElement: step.consecutiveSameElement,
          lastElectricCol: step.lastElectricCol,
          phase: "falling",
        }));
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
          setState((prev) => ({
            ...prev,
            board: steps[nextIdx].clearedBoard,
            combo: steps[nextIdx].combo,
            phase: "clearing",
          }));
        } else {
          // Cascade fully done — return to idle (timer drives game-over)
          setState((prev) => ({ ...prev, phase: "idle" }));
        }
      }, FALL_ANIM_MS);
      return () => clearTimeout(id);
    }
  }, [state.phase]);

  // ---------------------------------------------------------------------------
  // selectCell
  // ---------------------------------------------------------------------------

  const selectCell = useCallback((pos: Position) => {
    const s = stateRef.current;
    if (s.phase !== "idle") return;

    // No tile selected yet — select this one
    if (!s.selected) {
      setState((prev) => ({ ...prev, selected: pos }));
      return;
    }

    const sel = s.selected;

    // Clicking same tile — deselect
    if (sel.row === pos.row && sel.col === pos.col) {
      setState((prev) => ({ ...prev, selected: null }));
      return;
    }

    // Not adjacent — move selection
    if (!isAdjacent(sel, pos)) {
      setState((prev) => ({ ...prev, selected: pos }));
      return;
    }

    // Adjacent — attempt swap
    const swapped = swapTiles(s.board, sel, pos);
    const steps = computeCascadeSteps(
      swapped,
      0,
      s.lastMatchElement,
      s.consecutiveSameElement,
      s.lastElectricCol,
    );

    if (steps.length === 0) {
      // No match — revert selection, no move consumed
      setState((prev) => ({ ...prev, selected: null }));
      return;
    }

    // Valid swap — start animated cascade
    cascadeStepsRef.current = steps;
    cascadeIdxRef.current = 0;

    setState((prev) => ({
      ...prev,
      board: swapped, // show swapped positions (layoutId animates the slide)
      selected: null,
      combo: 0,
      phase: "swapping",
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // activateUlt
  // ---------------------------------------------------------------------------

  const activateUlt = useCallback((element: FoxElement) => {
    const s = stateRef.current;
    if (s.phase !== "idle") return;
    if (s.spiritCharge[element] < SPIRIT_MAX) return;

    const newCharge = { ...s.spiritCharge, [element]: 0 };
    let board = s.board.map((row) => [...row]);
    let gemsDelta = 0;
    let isDarkTheme = s.isDarkTheme;
    let isTimeSlow = s.isTimeSlow;
    let timeLeft = s.timeLeft;

    switch (element) {
      case "ori": {
        const count =
          WHITE_FOX_MIN_TILES +
          Math.floor(Math.random() * WHITE_FOX_TILE_VARIANCE);
        const positions: Position[] = [];
        for (let r = 0; r < GRID_ROWS; r++)
          for (let c = 0; c < GRID_COLS; c++)
            if (board[r][c]) positions.push({ row: r, col: c });
        for (let i = 0; i < Math.min(count, positions.length); i++) {
          const j = Math.floor(Math.random() * positions.length);
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        for (let i = 0; i < Math.min(count, positions.length); i++) {
          const { row, col } = positions[i];
          const tile = board[row][col];
          if (tile)
            board[row][col] = {
              ...tile,
              element: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
            };
        }
        break;
      }
      case "red": {
        const count =
          RED_FOX_MIN_TILES + Math.floor(Math.random() * RED_FOX_TILE_VARIANCE);
        const positions: Position[] = [];
        for (let r = 0; r < GRID_ROWS; r++)
          for (let c = 0; c < GRID_COLS; c++)
            if (board[r][c]) positions.push({ row: r, col: c });
        for (let i = 0; i < Math.min(count, positions.length); i++) {
          const j = Math.floor(Math.random() * positions.length);
          [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        for (let i = 0; i < Math.min(count, positions.length); i++) {
          const { row, col } = positions[i];
          if (board[row][col]?.hasGem) gemsDelta++;
          board[row][col] = null;
        }
        board = refillBoard(applyGravity(board), GRID_ROWS, GRID_COLS);
        break;
      }
      case "electric": {
        const col = s.lastElectricCol;
        for (let r = 0; r < GRID_ROWS; r++) {
          if (board[r][col]?.hasGem) gemsDelta++;
          board[r][col] = null;
        }
        board = refillBoard(applyGravity(board), GRID_ROWS, GRID_COLS);
        break;
      }
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
      case "night": {
        isDarkTheme = true;
        isTimeSlow = true;
        timeLeft = Math.min(
          timeLeft + NIGHT_FOX_TIME_BONUS_MS,
          GAME_DURATION_MS,
        );
        break;
      }
      case "sakura": {
        const gemPositions: Position[] = [];
        for (let r = 0; r < GRID_ROWS; r++)
          for (let c = 0; c < GRID_COLS; c++)
            if (board[r][c]?.hasGem) gemPositions.push({ row: r, col: c });
        const count = Math.min(
          SAKURA_MIN_GEMS + Math.floor(Math.random() * SAKURA_GEM_VARIANCE),
          gemPositions.length,
        );
        for (let i = 0; i < count; i++) {
          const j = Math.floor(Math.random() * gemPositions.length);
          [gemPositions[i], gemPositions[j]] = [
            gemPositions[j],
            gemPositions[i],
          ];
        }
        for (let i = 0; i < count; i++) {
          const { row, col } = gemPositions[i];
          gemsDelta++;
          board[row][col] = { ...board[row][col]!, hasGem: false };
        }
        break;
      }
    }

    const steps = computeCascadeSteps(
      board,
      s.combo,
      s.lastMatchElement,
      s.consecutiveSameElement,
      s.lastElectricCol,
    );

    if (steps.length > 0) {
      cascadeStepsRef.current = steps;
      cascadeIdxRef.current = 0;

      setState((prev) => ({
        ...prev,
        board: steps[0].clearedBoard,
        spiritCharge: newCharge,
        gems: prev.gems + gemsDelta,
        isDarkTheme,
        isTimeSlow,
        timeLeft,
        combo: steps[0].combo,
        phase: "clearing",
      }));
    } else {
      setState((prev) => ({
        ...prev,
        board,
        spiritCharge: newCharge,
        gems: prev.gems + gemsDelta,
        isDarkTheme,
        isTimeSlow,
        timeLeft,
        phase: "idle",
      }));
    }
  }, []);

  // ---------------------------------------------------------------------------
  // resetGame
  // ---------------------------------------------------------------------------

  const resetGame = useCallback(() => {
    cascadeStepsRef.current = [];
    cascadeIdxRef.current = 0;
    setState(makeInitialState());
  }, []);

  return { state, selectCell, activateUlt, resetGame };
}
