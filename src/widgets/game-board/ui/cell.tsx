import { AnimatePresence, motion } from "motion/react";
import { FOX_DEFS } from "../../../entities/fox";
import type { CellState, Position } from "../../../shared/types/game";
import { FoxTile } from "./fox-tile";

const tileSelectSound = new Audio("/tile-select.mp3");

interface CellProps {
  tile: CellState;
  pos: Position;
  isSelected: boolean;
  isHint: boolean;
  onClick: (pos: Position) => void;
}

export function Cell({ tile, pos, isSelected, isHint, onClick }: CellProps) {
  const hintColor = tile !== null ? FOX_DEFS[tile.element].accentColor : "rgba(255,255,255,0.6)";
  const showHint = isHint && !isSelected;

  return (
    <div
      className="relative w-full h-full rounded-lg"
      onClick={() => { tileSelectSound.currentTime = 0; tileSelectSound.play(); onClick(pos); }}
    >
      {/* Empty hole background */}
      <div className="absolute inset-0 rounded-lg bg-neutral-900/60 border border-neutral-700/40" />

      <AnimatePresence>
        {tile !== null && (
          <motion.div
            key={tile.tileId}
            layoutId={tile.tileId}
            className="absolute inset-0 rounded-lg"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{
              scale: isSelected ? 1.1 : 1,
              opacity: 1,
              boxShadow: isSelected
                ? `0 0 0 3px rgba(255,255,255,0.85), 0 0 12px rgba(255,255,255,0.4)`
                : showHint
                ? ["none", `0 0 0 3px ${hintColor}, 0 0 18px ${hintColor}`, "none"]
                : "none",
            }}
            exit={{ scale: 1.35, opacity: 0 }}
            transition={
              showHint
                ? {
                    layout: { type: "spring", stiffness: 500, damping: 35 },
                    scale: { type: "spring", stiffness: 600, damping: 30 },
                    opacity: { duration: 0.15 },
                    boxShadow: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
                  }
                : {
                    layout: { type: "spring", stiffness: 500, damping: 35 },
                    scale: { type: "spring", stiffness: 600, damping: 30 },
                    opacity: { duration: 0.15 },
                    boxShadow: { type: "spring", stiffness: 600, damping: 30 },
                  }
            }
            style={{ zIndex: isSelected ? 10 : 0 }}
          >
            <FoxTile tile={tile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
