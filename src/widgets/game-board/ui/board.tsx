import { LayoutGroup } from "motion/react";
import { GRID_COLS, GRID_ROWS } from "../../../shared/config/game-config";
import type { CellState, Position } from "../../../shared/types/game";
import { Cell } from "./cell";

interface BoardProps {
  board: CellState[][];
  selected: Position | null;
  onCellClick: (pos: Position) => void;
}

export function Board({ board, selected, onCellClick }: BoardProps) {
  return (
    <LayoutGroup>
      <div
        className="inline-grid gap-2 p-5 rounded-2xl bg-neutral-800/50 backdrop-blur"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
          width: "min(90vw, 800px)",
          height: "min(90vw, 800px)",
        }}
      >
        {Array.from({ length: GRID_ROWS }, (_, r) =>
          Array.from({ length: GRID_COLS }, (_, c) => {
            const pos: Position = { row: r, col: c };
            const key = `${r},${c}`;
            const isSelected =
              selected !== null && selected.row === r && selected.col === c;

            return (
              <Cell
                key={key}
                tile={board[r]?.[c] ?? null}
                pos={pos}
                isSelected={isSelected}
                onClick={onCellClick}
              />
            );
          }),
        )}
      </div>
    </LayoutGroup>
  );
}
