import { AnimatePresence, motion } from "motion/react";
import { TILE_DEFS } from "~/entities/tile";
import {
  TILE_BOXSHADOW_DURATION,
  TILE_EXIT_DURATION,
  TILE_HINT_PULSE_DURATION,
  TILE_LAYOUT_DURATION,
  TILE_OPACITY_DURATION,
  TILE_SCALE_DURATION,
} from "~/shared/config/game-config";
import type { CellState, Position } from "~/shared/types/game";
import { Tile } from "./tile";
import { useTileSwipe } from "./use-tile-swipe";

interface CellProps {
  tile: CellState;
  pos: Position;
  isDragSource: boolean;
  isHint: boolean;
  isNew: boolean;
  onSwipe: (from: Position, to: Position) => void;
  onDragSource: (pos: Position | null) => void;
}

export function Cell({
  tile,
  pos,
  isDragSource,
  isHint,
  isNew,
  onSwipe,
  onDragSource,
}: CellProps) {
  const hintColor =
    tile !== null ? TILE_DEFS[tile.element].catDark : "rgba(255,255,255,0.6)";
  const showHint = isHint && !isDragSource;

  const handleDragSource = (p: Position | null) => {
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
          // Outer: owns layoutId (swap/fall sliding) only. Keeping layout
          // projection off the fading element prevents Motion from skipping
          // the exit opacity when a tile is cleared mid-swap.
          <motion.div
            key={tile.tileId}
            layoutId={tile.tileId}
            className="absolute inset-0 rounded-lg"
            transition={{
              layout: { duration: TILE_LAYOUT_DURATION, ease: "easeOut" },
            }}
            style={{ zIndex: isDragSource ? 10 : 0 }}
          >
            {/* Inner: owns scale/opacity/boxShadow + exit. No layout, so the
                disappearance is uniform for every tile in a match. */}
            <motion.div
              className="h-full w-full rounded-lg"
              initial={isNew ? { scale: 0.4, opacity: 0 } : false}
              animate={{
                scale: isDragSource ? 1.1 : 1,
                opacity: 1,
                boxShadow: showHint
                  ? [
                      `0 0 0 0px ${hintColor}, 0 0 0px ${hintColor}`,
                      `0 0 0 5px ${hintColor}, 0 0 18px ${hintColor}`,
                      `0 0 0 0px ${hintColor}, 0 0 0px ${hintColor}`,
                    ]
                  : "none",
              }}
              exit={{
                scale: 1.35,
                opacity: 0,
                transition: { duration: TILE_EXIT_DURATION, ease: "easeOut" },
              }}
              transition={
                showHint
                  ? {
                      scale: { duration: TILE_SCALE_DURATION, ease: "easeOut" },
                      opacity: { duration: TILE_OPACITY_DURATION },
                      boxShadow: {
                        duration: TILE_HINT_PULSE_DURATION,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
                  : {
                      scale: { duration: TILE_SCALE_DURATION, ease: "easeOut" },
                      opacity: { duration: TILE_OPACITY_DURATION },
                      boxShadow: {
                        duration: TILE_BOXSHADOW_DURATION,
                        ease: "easeOut",
                      },
                    }
              }
            >
              <Tile tile={tile} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
