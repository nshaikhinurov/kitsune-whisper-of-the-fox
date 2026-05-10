import { AnimatePresence, motion } from "motion/react";
import { TILE_DEFS } from "~/entities/tile";
import { Audition } from "~/shared/lib/audition";
import type { CellState, Position } from "~/shared/types/game";
import { Tile } from "./tile";
import { useTileSwipe } from "./use-tile-swipe";

interface CellProps {
  tile: CellState;
  pos: Position;
  isSelected: boolean;
  isHint: boolean;
  isNew: boolean;
  onSwipe: (from: Position, to: Position) => void;
  onDragSource: (pos: Position | null) => void;
}

export function Cell({
  tile,
  pos,
  isSelected,
  isHint,
  isNew,
  onSwipe,
  onDragSource,
}: CellProps) {
  const hintColor =
    tile !== null
      ? TILE_DEFS[tile.element].accentColor
      : "rgba(255,255,255,0.6)";
  const showHint = isHint && !isSelected;

  const handleDragSource = (p: Position | null) => {
    if (p !== null) {
      Audition.tileSelect();
    }
    onDragSource(p);
  };

  const { ref, bind } = useTileSwipe(pos, onSwipe, handleDragSource);

  return (
    <div
      ref={ref}
      {...bind()}
      className="relative h-full w-full cursor-grab touch-none select-none"
    >
      {/* Empty hole background */}
      <div className="absolute inset-0 rounded-md sm:rounded-lg" />

      <AnimatePresence>
        {tile !== null && (
          <motion.div
            key={tile.tileId}
            layoutId={tile.tileId}
            className="absolute inset-0 rounded-lg"
            initial={isNew ? { scale: 0.4, opacity: 0 } : false}
            animate={{
              scale: isSelected ? 1.1 : 1,
              opacity: 1,
              boxShadow: showHint
                ? [
                    `0 0 0 0px ${hintColor}, 0 0 0px ${hintColor}`,
                    `0 0 0 5px ${hintColor}, 0 0 18px ${hintColor}`,
                    `0 0 0 0px ${hintColor}, 0 0 0px ${hintColor}`,
                  ]
                : "none",
            }}
            exit={{ scale: 1.35, opacity: 0 }}
            transition={
              showHint
                ? {
                    layout: { type: "spring", stiffness: 380, damping: 38 },
                    scale: { type: "spring", stiffness: 380, damping: 38 },
                    opacity: { duration: 0.15 },
                    boxShadow: {
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
                : {
                    layout: { type: "spring", stiffness: 380, damping: 38 },
                    scale: { type: "spring", stiffness: 380, damping: 38 },
                    opacity: { duration: 0.15 },
                    boxShadow: { type: "spring", stiffness: 380, damping: 38 },
                  }
            }
            style={{ zIndex: isSelected ? 10 : 0 }}
          >
            <Tile tile={tile} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
