import { LayoutGroup } from "motion/react";
import { GRID_COLS, GRID_ROWS } from "../../../shared/config/game-config";
import type { CellState, Position } from "../../../shared/types/game";
import { Cell } from "./cell";

interface BoardProps {
  board: CellState[][];
  selected: Position | null;
  hintPositions: [Position, Position] | null;
  onSwipe: (from: Position, to: Position) => void;
  onDragSource: (pos: Position | null) => void;
}

export function Board({
  board,
  selected,
  hintPositions,
  onSwipe,
  onDragSource,
}: BoardProps) {
  return (
    <LayoutGroup>
      <div
        className="bg-muted inline-grid aspect-square w-full gap-1 rounded-lg p-1.5 backdrop-blur sm:gap-2 sm:rounded-2xl sm:p-5"
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
                onSwipe={onSwipe}
                onDragSource={onDragSource}
              />
            );
          }),
        )}
      </div>
    </LayoutGroup>
  );
}
