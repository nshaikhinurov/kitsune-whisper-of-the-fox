import { useDrag } from "@use-gesture/react";
import { useRef } from "react";
import { GRID_COLS, GRID_ROWS } from "~/shared/config/game-config";
import type { Position } from "~/shared/types/game";

const SWIPE_THRESHOLD_RATIO = 0.3;

export function useTileSwipe(
  pos: Position,
  onSwipe: (from: Position, to: Position) => void,
  onDragSource: (pos: Position | null) => void,
) {
  const ref = useRef<HTMLDivElement>(null!);
  const swipeFiredRef = useRef(false);

  const bind = useDrag(
    ({ first, last, active, movement: [mx, my] }) => {
      if (first) {
        swipeFiredRef.current = false;
        onDragSource(pos);
      }

      if (active && !swipeFiredRef.current) {
        const tileSize = ref.current?.getBoundingClientRect().width ?? 80;
        const threshold = tileSize * SWIPE_THRESHOLD_RATIO;

        if (Math.max(Math.abs(mx), Math.abs(my)) > threshold) {
          let target: Position;
          if (Math.abs(mx) >= Math.abs(my)) {
            target = { row: pos.row, col: pos.col + (mx > 0 ? 1 : -1) };
          } else {
            target = { row: pos.row + (my > 0 ? 1 : -1), col: pos.col };
          }

          target = {
            row: Math.max(0, Math.min(GRID_ROWS - 1, target.row)),
            col: Math.max(0, Math.min(GRID_COLS - 1, target.col)),
          };

          swipeFiredRef.current = true;
          onSwipe(pos, target);
        }
      }

      if (last) {
        onDragSource(null);
        swipeFiredRef.current = false;
      }
    },
    { pointer: { touch: true }, filterTaps: true, preventScrollAxis: "xy" },
  );

  return { ref, bind };
}
