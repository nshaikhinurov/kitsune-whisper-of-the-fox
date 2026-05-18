// Pure, deterministic game engine. Given the same seed + action log it produces
// the same score on the client and on the server, which is what makes
// server-authoritative replay validation possible.
//
// The scoring/combo arithmetic below is transcribed verbatim from the React hook
// (src/features/game-session/model/use-game-state.ts). It intentionally mirrors
// the hook bug-for-bug — including the ultimate's first-cascade-step being scored
// twice — because the goal is to reproduce exactly what the client awarded, not
// to "fix" the game. The parity test guards this equivalence.

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
  INITIAL_SPIRIT_CHARGE,
  JITTER_MS,
  NIGHT_TIME_BONUS_MS,
  RED_MIN_TILES,
  RED_TILE_VARIANCE,
  SAKURA_HEART_VARIANCE,
  SAKURA_MIN_HEARTS,
  SCORE_PER_HEART,
  SPIRIT_CHARGE_PER_MATCH,
  SPIRIT_MAX,
  SWAP_ANIM_MS,
  WALLCLOCK_TOLERANCE_MS,
  WHITE_MIN_TILES,
  WHITE_TILE_VARIANCE,
  ZEN_MAX_GAME_MS,
} from "./config";
import {
  applyGravity,
  createBoard,
  createTileFactory,
  isAdjacent,
  pickRandomNonNullCells,
  refillBoard,
  shuffleRegion,
  swapTiles,
  type TileFactory,
} from "./board";
import { findMatches, parseKey, positionsToSet, posKey } from "./matches";
import { createRng, type Rng } from "./rng";
import type { CellState, Position, SpiritCharge, TileElement } from "./types";

// ---------------------------------------------------------------------------
// Cascade step — one iteration of: clear matches -> gravity -> refill
// ---------------------------------------------------------------------------

export interface CascadeStep {
  clearedBoard: CellState[][];
  filledBoard: CellState[][];
  baseScoreDelta: number;
  heartsDelta: number;
  spiritDelta: Partial<Record<TileElement, number>>;
  lastMatchElement: TileElement | null;
  consecutiveSameElement: number;
  lastElectricCol: number;
  matchedCentroid: { row: number; col: number };
  deadlocked?: boolean;
}

export function computeCascadeSteps(
  initialBoard: CellState[][],
  startLastElement: TileElement | null,
  startConsecutive: number,
  startElectricCol: number,
  makeTile: TileFactory,
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
      makeTile,
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

export function applyChargeDeltas(
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
// Ultimate board effect — pure port of the activateUlt switch (no audio).
// ---------------------------------------------------------------------------

export interface UltEffect {
  board: CellState[][];
  heartsDelta: number;
  isNight: boolean;
  timeLeft: number;
  deadlocked: boolean;
}

export function applyUltEffect(
  element: TileElement,
  startBoard: CellState[][],
  startIsNight: boolean,
  startTimeLeft: number,
  makeTile: TileFactory,
  rng: Rng,
  zenMode = false,
): UltEffect {
  let board = startBoard.map((row) => [...row]);
  let heartsDelta = 0;
  let isNight = startIsNight;
  let timeLeft = startTimeLeft;
  let deadlocked = false;

  switch (element) {
    case "ori": {
      const count =
        WHITE_MIN_TILES + Math.floor(rng() * WHITE_TILE_VARIANCE);
      for (const { row, col } of pickRandomNonNullCells(board, count, rng)) {
        const tile = board[row][col];
        if (tile)
          board[row][col] = {
            ...tile,
            element: ELEMENTS[Math.floor(rng() * ELEMENTS.length)],
          };
      }
      break;
    }
    case "green": {
      const count = RED_MIN_TILES + Math.floor(rng() * RED_TILE_VARIANCE);
      for (const { row, col } of pickRandomNonNullCells(board, count, rng)) {
        if (board[row][col]?.hasHeart) heartsDelta++;
        board[row][col] = null;
      }
      ({ board, deadlocked } = refillBoard(
        applyGravity(board),
        GRID_ROWS,
        GRID_COLS,
        makeTile,
        zenMode,
      ));
      break;
    }
    case "electric": {
      const col = Math.floor(rng() * GRID_COLS);
      for (let r = 0; r < GRID_ROWS; r++) {
        if (board[r][col]?.hasHeart) heartsDelta++;
        board[r][col] = null;
      }
      ({ board, deadlocked } = refillBoard(
        applyGravity(board),
        GRID_ROWS,
        GRID_COLS,
        makeTile,
        zenMode,
      ));
      break;
    }
    case "chaotic": {
      const startRow = Math.floor(
        rng() * (GRID_ROWS - CHAOTIC_PATCH_SIZE + 1),
      );
      const startCol = Math.floor(
        rng() * (GRID_COLS - CHAOTIC_PATCH_SIZE + 1),
      );
      const positions: Position[] = [];
      for (let r = startRow; r < startRow + CHAOTIC_PATCH_SIZE; r++)
        for (let c = startCol; c < startCol + CHAOTIC_PATCH_SIZE; c++)
          positions.push({ row: r, col: c });
      board = shuffleRegion(board, positions, rng);
      break;
    }
    case "night": {
      isNight = true;
      timeLeft = Math.min(timeLeft + NIGHT_TIME_BONUS_MS, GAME_DURATION_MS);
      break;
    }
    case "sakura": {
      const heartPositions: Position[] = [];
      for (let r = 0; r < GRID_ROWS; r++)
        for (let c = 0; c < GRID_COLS; c++)
          if (board[r][c]?.hasHeart) heartPositions.push({ row: r, col: c });
      const count = Math.min(
        SAKURA_MIN_HEARTS + Math.floor(rng() * SAKURA_HEART_VARIANCE),
        heartPositions.length,
      );
      for (let i = 0; i < count; i++) {
        const j = i + Math.floor(rng() * (heartPositions.length - i));
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
      const heartlessPositions: Position[] = [];
      for (let r = 0; r < GRID_ROWS; r++)
        for (let c = 0; c < GRID_COLS; c++)
          if (board[r][c] && !board[r][c]!.hasHeart)
            heartlessPositions.push({ row: r, col: c });
      const spawnCount = Math.min(
        SAKURA_MIN_HEARTS + Math.floor(rng() * SAKURA_HEART_VARIANCE),
        heartlessPositions.length,
      );
      for (let i = 0; i < spawnCount; i++) {
        const j = i + Math.floor(rng() * (heartlessPositions.length - i));
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

  return { board, heartsDelta, isNight, timeLeft, deadlocked };
}

// ---------------------------------------------------------------------------
// Headless replay state machine
// ---------------------------------------------------------------------------

export type GameMode = "normal" | "zen";

export interface EngineState {
  board: CellState[][];
  score: number;
  hearts: number;
  combo: number;
  comboResetAt: number | null;
  lastMatchElement: TileElement | null;
  consecutiveSameElement: number;
  lastElectricCol: number;
  spiritCharge: SpiritCharge;
  isNight: boolean;
  timeLeftMs: number;
  timerStarted: boolean;
  over: boolean;
  overReason: "time" | "deadlock" | null;
  // Non-serialized determinism context
  rng: Rng;
  makeTile: TileFactory;
  zenMode: boolean;
}

export function createGame(seed: number, mode: GameMode): EngineState {
  const rng = createRng(seed);
  const makeTile = createTileFactory(rng);
  return {
    board: createBoard(GRID_ROWS, GRID_COLS, makeTile),
    score: 0,
    hearts: 0,
    combo: 0,
    comboResetAt: null,
    lastMatchElement: null,
    consecutiveSameElement: 0,
    lastElectricCol: 0,
    spiritCharge: { ...INITIAL_SPIRIT_CHARGE },
    isNight: false,
    timeLeftMs: GAME_DURATION_MS,
    timerStarted: false,
    over: false,
    overReason: null,
    rng,
    makeTile,
    zenMode: mode === "zen",
  };
}

export interface ActionResult {
  ok: boolean;
  reason?: string;
  steps: CascadeStep[];
}

// Applies the wall-clock combo-reset timer for an action occurring at time `t`
// (ms since the game's first action). Mirrors scheduleComboReset's setTimeout:
// combo resets when `t` reaches the moment 2s after the last clearing phase
// began.
function maybeResetCombo(s: EngineState, t: number): void {
  if (s.comboResetAt !== null && t >= s.comboResetAt) s.combo = 0;
}

function lastClearingStart(t: number, hasSwapPhase: boolean, n: number): number {
  return (
    t + (hasSwapPhase ? SWAP_ANIM_MS : 0) + (n - 1) * (CLEAR_ANIM_MS + FALL_ANIM_MS)
  );
}

export function applySwap(
  s: EngineState,
  from: Position,
  to: Position,
  t: number,
): ActionResult {
  if (s.over) return { ok: false, reason: "game-over", steps: [] };
  if (!isAdjacent(from, to))
    return { ok: false, reason: "not-adjacent", steps: [] };

  const swapped = swapTiles(s.board, from, to);
  const steps = computeCascadeSteps(
    swapped,
    s.lastMatchElement,
    s.consecutiveSameElement,
    s.lastElectricCol,
    s.makeTile,
    s.zenMode,
  );
  if (steps.length === 0) return { ok: false, reason: "no-match", steps: [] };

  maybeResetCombo(s, t);
  s.board = swapped;
  s.timerStarted = true;

  // "swapping" -> "clearing" -> "falling" loop. combo increments once per step
  // (in swapping for k=0, in falling for k>0); score is added in "clearing".
  for (let k = 0; k < steps.length; k++) {
    s.combo += 1;
    const mult = 1 + COMBO_MULT_STEP * (s.combo - 1);
    const step = steps[k];
    s.score +=
      Math.round(step.baseScoreDelta * mult) +
      step.heartsDelta * SCORE_PER_HEART;
    s.hearts += step.heartsDelta;
    s.spiritCharge = applyChargeDeltas(s.spiritCharge, step.spiritDelta);
    s.lastMatchElement = step.lastMatchElement;
    s.consecutiveSameElement = step.consecutiveSameElement;
    s.lastElectricCol = step.lastElectricCol;
  }

  s.comboResetAt =
    lastClearingStart(t, true, steps.length) + COMBO_RESET_MS;

  if (steps[steps.length - 1].deadlocked) {
    s.over = true;
    s.overReason = "deadlock";
  }
  return { ok: true, steps };
}

export function applyUlt(
  s: EngineState,
  element: TileElement,
  t: number,
): ActionResult {
  if (s.over) return { ok: false, reason: "game-over", steps: [] };
  if (s.spiritCharge[element] < SPIRIT_MAX)
    return { ok: false, reason: "not-charged", steps: [] };

  const newCharge: SpiritCharge = { ...s.spiritCharge, [element]: 0 };
  const eff = applyUltEffect(
    element,
    s.board,
    s.isNight,
    s.timeLeftMs,
    s.makeTile,
    s.rng,
    s.zenMode,
  );

  const steps = computeCascadeSteps(
    eff.board,
    s.lastMatchElement,
    s.consecutiveSameElement,
    s.lastElectricCol,
    s.makeTile,
    s.zenMode,
  );

  maybeResetCombo(s, t);
  s.isNight = eff.isNight;
  s.timeLeftMs = eff.timeLeft;
  s.timerStarted = true;

  if (steps.length > 0) {
    // Mirror the ult setState: combo bumps once, step[0] base + ult-removed
    // hearts are added here, THEN the clearing/falling loop adds every step
    // (so step[0] base is intentionally counted twice — matches the hook).
    s.combo += 1;
    const mult0 = 1 + COMBO_MULT_STEP * (s.combo - 1);
    s.score +=
      Math.round(steps[0].baseScoreDelta * mult0) +
      eff.heartsDelta * SCORE_PER_HEART;
    s.hearts += eff.heartsDelta;
    s.spiritCharge = newCharge;
    s.board = steps[0].clearedBoard;

    for (let k = 0; k < steps.length; k++) {
      if (k > 0) s.combo += 1;
      const mult = 1 + COMBO_MULT_STEP * (s.combo - 1);
      const step = steps[k];
      s.score +=
        Math.round(step.baseScoreDelta * mult) +
        step.heartsDelta * SCORE_PER_HEART;
      s.hearts += step.heartsDelta;
      s.spiritCharge = applyChargeDeltas(s.spiritCharge, step.spiritDelta);
      s.lastMatchElement = step.lastMatchElement;
      s.consecutiveSameElement = step.consecutiveSameElement;
      s.lastElectricCol = step.lastElectricCol;
    }

    s.comboResetAt =
      lastClearingStart(t, false, steps.length) + COMBO_RESET_MS;

    if (steps[steps.length - 1].deadlocked) {
      s.over = true;
      s.overReason = "deadlock";
    }
    return { ok: true, steps };
  }

  // No cascade: ult-removed hearts still score; combo/timer untouched.
  s.spiritCharge = newCharge;
  s.board = eff.board;
  s.score += eff.heartsDelta * SCORE_PER_HEART;
  s.hearts += eff.heartsDelta;
  if (eff.deadlocked) {
    s.over = true;
    s.overReason = "deadlock";
  }
  return { ok: true, steps: [] };
}

// ---------------------------------------------------------------------------
// Replay — the server's authoritative scorer (Phase 2 will call this).
// ---------------------------------------------------------------------------

export type ReplayAction =
  | { t: number; type: "swap"; from: Position; to: Position }
  | { t: number; type: "ult"; element: TileElement };

export interface ReplayResult {
  score: number;
  hearts: number;
  over: boolean;
  overReason: "time" | "deadlock" | null;
  // Rule validity: an action the engine rejected (illegal swap, uncharged ult,
  // action after game-over). The score still reflects only accepted actions.
  invalid: boolean;
  invalidReason?: string;
  // Timeline validity: the recorded `t` spacing is physically impossible given
  // the animation lock, or the run runs past its time budget. Kept separate
  // from `invalid` so honest-but-divergent runs are shadow-flagged, not lost.
  timelineInvalid: boolean;
  timelineReason?: string;
}

// Wall-clock duration the board is locked after an action fires: the swap
// tween (swaps only) plus one clear+fall per deterministic cascade step. The
// next action cannot legally start before this elapses (minus JITTER_MS).
function actionDurationMs(type: "swap" | "ult", numSteps: number): number {
  return (
    (type === "swap" ? SWAP_ANIM_MS : 0) +
    numSteps * (CLEAR_ANIM_MS + FALL_ANIM_MS)
  );
}

export function replay(
  seed: number,
  mode: GameMode,
  actions: ReplayAction[],
): ReplayResult {
  const s = createGame(seed, mode);
  let invalid = false;
  let invalidReason: string | undefined;
  let timelineInvalid = false;
  let timelineReason: string | undefined;

  const flagTimeline = (reason: string) => {
    if (!timelineInvalid) {
      timelineInvalid = true;
      timelineReason = reason;
    }
  };

  // Virtual time budget. Normal mode is the countdown; each accepted Night ult
  // extends it (matching applyUltEffect). Zen has no timer, only a sane cap.
  let budgetMs = mode === "zen" ? ZEN_MAX_GAME_MS : GAME_DURATION_MS;
  let prevT = 0;
  let earliestNextT = 0;
  let first = true;

  for (const a of actions) {
    if (a.t < 0) flagTimeline("negative-t");
    if (!first && a.t < prevT) flagTimeline("non-monotonic-t");
    if (!first && a.t < earliestNextT - JITTER_MS) flagTimeline("gap-too-small");
    if (mode === "normal" && a.t > budgetMs + JITTER_MS)
      flagTimeline("over-budget");

    const res =
      a.type === "swap"
        ? applySwap(s, a.from, a.to, a.t)
        : applyUlt(s, a.element, a.t);
    if (!res.ok && !invalid) {
      invalid = true;
      invalidReason = res.reason;
    }

    if (
      mode === "normal" &&
      a.type === "ult" &&
      a.element === "night" &&
      res.ok
    ) {
      budgetMs += NIGHT_TIME_BONUS_MS;
    }

    earliestNextT = a.t + actionDurationMs(a.type, res.steps.length);
    prevT = a.t;
    first = false;
  }

  const lastT = actions.length ? actions[actions.length - 1].t : 0;
  if (mode === "normal" && lastT > budgetMs + JITTER_MS)
    flagTimeline("span-over-budget");
  if (mode === "zen" && lastT > ZEN_MAX_GAME_MS) flagTimeline("zen-cap");

  return {
    score: s.score,
    hearts: s.hearts,
    over: s.over,
    overReason: s.overReason,
    invalid,
    invalidReason,
    timelineInvalid,
    timelineReason,
  };
}

// Pure wall-clock cross-check: real elapsed time since startGame must be at
// least the last action's virtual timestamp, minus a tolerance band. Stops a
// 60s game from being submitted 3s after startGame. Only a lower bound — real
// pauses make real elapsed longer, never shorter.
export function wallClockInvalid(
  realElapsedMs: number,
  actions: ReplayAction[],
): boolean {
  const lastT = actions.length ? actions[actions.length - 1].t : 0;
  return realElapsedMs < lastT - WALLCLOCK_TOLERANCE_MS;
}
