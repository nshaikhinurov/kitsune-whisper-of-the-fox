import { MIN_MATCH_LENGTH } from "../config/game-config";
import type { CellState, Match, Position } from "../types/game";

export function findMatches(board: CellState[][]): Match[] {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const matches: Match[] = [];

  // Scan rows for horizontal matches
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const tile = board[r][c];
      if (!tile) { c++; continue; }
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
      if (!tile) { r++; continue; }
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

export function hasPossibleMove(board: CellState[][]): boolean {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) {
        const swapped = board.map(row => [...row]);
        [swapped[r][c], swapped[r][c + 1]] = [swapped[r][c + 1], swapped[r][c]];
        if (findMatches(swapped).length > 0) return true;
      }
      if (r + 1 < rows) {
        const swapped = board.map(row => [...row]);
        [swapped[r][c], swapped[r + 1][c]] = [swapped[r + 1][c], swapped[r][c]];
        if (findMatches(swapped).length > 0) return true;
      }
    }
  }

  return false;
}

export function positionsToSet(matches: Match[]): Set<string> {
  const set = new Set<string>();
  for (const match of matches) {
    for (const pos of match.positions) {
      set.add(`${pos.row},${pos.col}`);
    }
  }
  return set;
}
