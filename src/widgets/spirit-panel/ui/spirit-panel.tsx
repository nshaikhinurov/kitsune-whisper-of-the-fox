import { motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { TILE_DEFS } from "~/entities/tile";
import { ELEMENTS, SPIRIT_MAX } from "~/shared/config/game-config";
import { cn } from "~/shared/lib/utils";
import type { SpiritCharge, TileElement } from "~/shared/types/game";
import { Avatar, AvatarFallback } from "~/shared/ui/avatar";
import { PawIcon } from "~/shared/ui/paw-icon";

interface SpiritPanelProps {
  spiritCharge: SpiritCharge;
  onActivate: (element: TileElement) => void;
}

// Glow ratios derived from lg: size 80px, blur 6/14px, spread 2/4px.
const GLOW_BLUR_MIN = 6 / 80;
const GLOW_BLUR_MAX = 14 / 80;
const GLOW_SPREAD_MIN = 2 / 80;
const GLOW_SPREAD_MAX = 4 / 80;

interface SpiritButtonProps {
  element: TileElement;
  isReady: boolean;
  pct: number;
  onActivate: (element: TileElement) => void;
}

function SpiritButton({
  element,
  isReady,
  pct,
  onActivate,
}: SpiritButtonProps) {
  const def = TILE_DEFS[element];
  const sizeRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(80);

  useLayoutEffect(() => {
    const el = sizeRef.current;
    if (!el) return;
    const update = () => setSize(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const blurMin = size * GLOW_BLUR_MIN;
  const blurMax = size * GLOW_BLUR_MAX;
  const spreadMin = size * GLOW_SPREAD_MIN;
  const spreadMax = size * GLOW_SPREAD_MAX;

  return (
    <motion.button
      className={cn(
        "rounded-full border-0 bg-transparent p-0",
        isReady ? "cursor-pointer" : "cursor-not-allowed",
      )}
      animate={{
        boxShadow: isReady
          ? [
              `0 0 ${blurMin}px ${spreadMin}px ${def.catDark}`,
              `0 0 ${blurMax}px ${spreadMax}px ${def.catDark}`,
              `0 0 ${blurMin}px ${spreadMin}px ${def.catDark}`,
            ]
          : "none",
        scale: isReady ? [1, 1.08, 1] : 1,
      }}
      transition={isReady ? { duration: 1.2, repeat: Infinity } : {}}
      onClick={() => isReady && onActivate(element)}
      disabled={!isReady}
    >
      <div ref={sizeRef} className="relative size-12 sm:size-14 lg:size-20">
        {/* Grayscale base layer */}
        <Avatar className="absolute inset-0 size-full border-[4.2px] border-mauve-300 bg-mauve-100 sm:border-[4.9px] lg:border-7 dark:border-mauve-800 dark:bg-mauve-900">
          <AvatarFallback className="bg-transparent p-0.5">
            <PawIcon className="aspect-square w-8/10 text-mauve-300 dark:text-mauve-800" />
          </AvatarFallback>
        </Avatar>

        {/* Color fill rising from the bottom */}
        <motion.div
          className="absolute inset-0"
          animate={{ clipPath: `inset(${100 - pct}% 0 0 0)` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        >
          <Avatar
            className="size-full border-[4.2px] sm:border-[4.9px] lg:border-7"
            style={{
              backgroundColor: def.catLight,
              borderColor: def.catDark,
            }}
          >
            <AvatarFallback className="bg-transparent p-0.5">
              <PawIcon
                className="aspect-square w-8/10"
                style={{ color: def.catDark }}
              />
            </AvatarFallback>
          </Avatar>
        </motion.div>
      </div>
    </motion.button>
  );
}

export function SpiritPanel({ spiritCharge, onActivate }: SpiritPanelProps) {
  return (
    <div className="flex w-full justify-around gap-2 px-2 sm:px-5 lg:h-full lg:gap-5 lg:py-9">
      {ELEMENTS.map((el) => {
        const charge = spiritCharge[el];
        const isReady = charge >= SPIRIT_MAX;
        const pct = Math.min(100, (charge / SPIRIT_MAX) * 100);

        return (
          <div key={el} className="flex flex-col items-center">
            <SpiritButton
              element={el}
              isReady={isReady}
              pct={pct}
              onActivate={onActivate}
            />
          </div>
        );
      })}
    </div>
  );
}
