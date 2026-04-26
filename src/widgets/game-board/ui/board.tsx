import { LayoutGroup } from "motion/react";
import { GRID_COLS, GRID_ROWS } from "../../../shared/config/game-config";
import type { CellState, Position } from "../../../shared/types/game";
import { Cell } from "./cell";

interface BoardProps {
  board: CellState[][];
  selected: Position | null;
  hintPositions: [Position, Position] | null;
  onCellClick: (pos: Position) => void;
}

export function Board({
  board,
  selected,
  hintPositions,
  onCellClick,
}: BoardProps) {
  return (
    <LayoutGroup>
      <div
        className="bg-muted inline-grid aspect-square w-[min(90vw,600px)] gap-1.5 rounded-2xl p-3 backdrop-blur sm:gap-2 sm:p-5 lg:w-[min(68vw,800px)]"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: GRID_ROWS }, (_, r) =>
          Array.from({ length: GRID_COLS }, (_, c) => {
            const pos: Position = { row: r, col: c };
            const key = `${r},${c}`;
            const isSelected =
              selected !== null && selected.row === r && selected.col === c;
            const isHint =
              hintPositions !== null &&
              hintPositions.some((p) => p.row === r && p.col === c);

            return (
              <Cell
                key={key}
                tile={board[r]?.[c] ?? null}
                pos={pos}
                isSelected={isSelected}
                isHint={isHint}
                onClick={onCellClick}
              />
            );
          }),
        )}
      </div>
    </LayoutGroup>
  );
}
