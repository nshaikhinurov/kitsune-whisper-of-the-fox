import {
  BOARD_GEN_ATTEMPTS,
  BOARD_MATCH_REMOVAL_ATTEMPTS,
  BOARD_REFILL_ATTEMPTS,
  ELEMENTS,
  STAR_SPAWN_CHANCE,
} from "../config/game-config";
import type { CellState, Position, TileState } from "../types/game";
import { findMatches, hasPossibleMove } from "./matches";

let _tileIdCounter = 0;
function nextTileId(): string {
  return `t${++_tileIdCounter}`;
}

function randomTile(): TileState {
  return {
    tileId: nextTileId(),
    element: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
    hasStar: Math.random() < STAR_SPAWN_CHANCE,
  };
}

export function createBoard(rows: number, cols: number): CellState[][] {
  let board: CellState[][];
  let outerAttempts = 0;

  do {
    board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => randomTile()),
    );

    // Remove any initial matches by re-rolling conflicting tiles
    let attempts = 0;
    while (
      findMatches(board).length > 0 &&
      attempts < BOARD_MATCH_REMOVAL_ATTEMPTS
    ) {
      attempts++;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const el = board[r][c]?.element;
          const leftEl = c >= 2 ? board[r][c - 1]?.element : null;
          const left2El = c >= 2 ? board[r][c - 2]?.element : null;
          const upEl = r >= 2 ? board[r - 1][c]?.element : null;
          const up2El = r >= 2 ? board[r - 2][c]?.element : null;

          if (
            (el === leftEl && el === left2El) ||
            (el === upEl && el === up2El)
          ) {
            board[r][c] = randomTile();
          }
        }
      }
    }

    outerAttempts++;
  } while (!hasPossibleMove(board) && outerAttempts < BOARD_GEN_ATTEMPTS);

  return board;
}

export function applyGravity(board: CellState[][]): CellState[][] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const next: CellState[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => board[r][c]),
  );

  for (let c = 0; c < cols; c++) {
    // Collect non-null tiles from bottom to top
    const tiles: CellState[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      if (next[r][c] !== null) tiles.push(next[r][c]);
    }
    // Fill from bottom, nulls at top
    for (let r = rows - 1; r >= 0; r--) {
      next[r][c] = tiles[rows - 1 - r] ?? null;
    }
  }

  return next;
}

export function refillBoard(
  board: CellState[][],
  rows: number,
  cols: number,
): CellState[][] {
  const next: CellState[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => board[r][c]),
  );

  const newPositions: Position[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c] === null) {
        next[r][c] = randomTile();
        newPositions.push({ row: r, col: c });
      }
    }
  }

  // Re-roll only newly added tiles until a possible move exists
  let attempts = 0;
  while (!hasPossibleMove(next) && attempts < BOARD_REFILL_ATTEMPTS) {
    for (const { row, col } of newPositions) {
      next[row][col] = randomTile();
    }
    attempts++;
  }

  return next;
}

export function isAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

export function swapTiles(
  board: CellState[][],
  a: Position,
  b: Position,
): CellState[][] {
  const next: CellState[][] = board.map((row) => [...row]);
  const tmp = next[a.row][a.col];
  next[a.row][a.col] = next[b.row][b.col];
  next[b.row][b.col] = tmp;
  return next;
}

export function shuffleRegion(
  board: CellState[][],
  positions: Position[],
): CellState[][] {
  const next: CellState[][] = board.map((row) => [...row]);
  const tiles = positions.map((p) => next[p.row][p.col]);

  // Fisher-Yates shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  for (let i = 0; i < positions.length; i++) {
    next[positions[i].row][positions[i].col] = tiles[i];
  }

  return next;
}
