import { MIN_MATCH_LENGTH } from "../config/game-config";
import type { CellState, Match, Position } from "../types/game";

export const posKey = (pos: Position): string => `${pos.row},${pos.col}`;
export const parseKey = (key: string): Position => {
  const comma = key.indexOf(",");
  return { row: +key.slice(0, comma), col: +key.slice(comma + 1) };
};

export function findMatches(board: CellState[][]): Match[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const matches: Match[] = [];

  // Scan rows for horizontal matches
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const tile = board[r][c];
      if (!tile) {
        c++;
        continue;
      }
      let len = 1;
      while (c + len < cols && board[r][c + len]?.element === tile.element) {
        len++;
      }
      if (len >= MIN_MATCH_LENGTH) {
        const positions: Position[] = [];
        for (let k = 0; k < len; k++) positions.push({ row: r, col: c + k });
        matches.push({ positions, element: tile.element });
      }
      c += len;
    }
  }

  // Scan columns for vertical matches
  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      const tile = board[r][c];
      if (!tile) {
        r++;
        continue;
      }
      let len = 1;
      while (r + len < rows && board[r + len][c]?.element === tile.element) {
        len++;
      }
      if (len >= MIN_MATCH_LENGTH) {
        const positions: Position[] = [];
        for (let k = 0; k < len; k++) positions.push({ row: r + k, col: c });
        matches.push({ positions, element: tile.element });
      }
      r += len;
    }
  }

  return matches;
}

function runLength(
  getEl: (r: number, c: number) => string | undefined,
  r: number,
  c: number,
  dr: number,
  dc: number,
  rows: number,
  cols: number,
): number {
  const el = getEl(r, c);
  if (!el) return 0;
  let len = 1;
  let nr = r + dr;
  let nc = c + dc;
  while (nr >= 0 && nr < rows && nc >= 0 && nc < cols && getEl(nr, nc) === el) {
    len++;
    nr += dr;
    nc += dc;
  }
  nr = r - dr;
  nc = c - dc;
  while (nr >= 0 && nr < rows && nc >= 0 && nc < cols && getEl(nr, nc) === el) {
    len++;
    nr -= dr;
    nc -= dc;
  }
  return len;
}

function matchExistsAfterSwap(
  board: CellState[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number,
  rows: number,
  cols: number,
): boolean {
  const getEl = (r: number, c: number): string | undefined => {
    const cell =
      r === r1 && c === c1
        ? board[r2][c2]
        : r === r2 && c === c2
          ? board[r1][c1]
          : board[r][c];
    return cell?.element;
  };

  for (const [pr, pc] of [
    [r1, c1],
    [r2, c2],
  ]) {
    if (runLength(getEl, pr, pc, 0, 1, rows, cols) >= MIN_MATCH_LENGTH)
      return true;
    if (runLength(getEl, pr, pc, 1, 0, rows, cols) >= MIN_MATCH_LENGTH)
      return true;
  }
  return false;
}

export function hasPossibleMove(board: CellState[][]): boolean {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols && matchExistsAfterSwap(board, r, c, r, c + 1, rows, cols))
        return true;
      if (r + 1 < rows && matchExistsAfterSwap(board, r, c, r + 1, c, rows, cols))
        return true;
    }
  }

  return false;
}

export function findFirstHintMove(
  board: CellState[][],
): [Position, Position] | null {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols && matchExistsAfterSwap(board, r, c, r, c + 1, rows, cols))
        return [{ row: r, col: c }, { row: r, col: c + 1 }];
      if (r + 1 < rows && matchExistsAfterSwap(board, r, c, r + 1, c, rows, cols))
        return [{ row: r, col: c }, { row: r + 1, col: c }];
    }
  }
  return null;
}

export function positionsToSet(matches: Match[]): Set<string> {
  const set = new Set<string>();
  for (const match of matches) {
    for (const pos of match.positions) {
      set.add(posKey(pos));
    }
  }
  return set;
}
