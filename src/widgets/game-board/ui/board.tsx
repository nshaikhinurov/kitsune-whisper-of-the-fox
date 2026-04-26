import { LayoutGroup, motion } from "motion/react";
import { GRID_COLS, GRID_ROWS } from "../../../shared/config/game-config";
import type {
  CellState,
  Position,
  ScoreFlash,
} from "../../../shared/types/game";
import { Cell } from "./cell";

interface BoardProps {
  board: CellState[][];
  selected: Position | null;
  hintPositions: [Position, Position] | null;
  scoreFlash: ScoreFlash | null;
  onSwipe: (from: Position, to: Position) => void;
  onDragSource: (pos: Position | null) => void;
}

export function Board({
  board,
  selected,
  hintPositions,
  scoreFlash,
  onSwipe,
  onDragSource,
}: BoardProps) {
  return (
    <LayoutGroup>
      <div className="relative w-full">
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

        {scoreFlash && (
          <motion.div
            key={scoreFlash.id}
            className="text-primary pointer-events-none absolute z-50 text-5xl font-black whitespace-nowrap"
            style={{
              left: `${((scoreFlash.col + 0.5) / GRID_COLS) * 100}%`,
              top: `${((scoreFlash.row + 0.5) / GRID_ROWS) * 100}%`,
              x: "-50%",
            }}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -36, scale: 1.4 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            +{scoreFlash.delta}
          </motion.div>
        )}
      </div>
    </LayoutGroup>
  );
}
