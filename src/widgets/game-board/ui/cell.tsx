import { AnimatePresence, motion } from "motion/react";
import type { CellState, Position } from "../../../shared/types/game";
import { FoxTile } from "./fox-tile";

interface CellProps {
  tile: CellState;
  pos: Position;
  isSelected: boolean;
  onClick: (pos: Position) => void;
}

export function Cell({ tile, pos, isSelected, onClick }: CellProps) {
  return (
    <div
      className="relative w-full h-full rounded-lg"
      onClick={() => onClick(pos)}
    >
      {/* Empty hole background */}
      <div className="absolute inset-0 rounded-lg bg-neutral-900/60 border border-neutral-700/40" />

      <AnimatePresence>
        {tile !== null && (
          <motion.div
            key={tile.tileId}
            layoutId={tile.tileId}
            className="absolute inset-0"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.35, opacity: 0 }}
            transition={{
              layout: { type: "spring", stiffness: 500, damping: 35 },
              scale: { duration: 0.18 },
              opacity: { duration: 0.15 },
            }}
          >
            <FoxTile tile={tile} isSelected={isSelected} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
