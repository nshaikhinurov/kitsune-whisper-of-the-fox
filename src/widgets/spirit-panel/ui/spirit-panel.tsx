import { motion } from "motion/react";
import { FOX_DEFS, FoxSprite } from "../../../entities/fox";
import { ELEMENTS, SPIRIT_MAX } from "../../../shared/config/game-config";
import { cn } from "../../../shared/lib/utils";
import type { FoxElement, SpiritCharge } from "../../../shared/types/game";

interface SpiritPanelProps {
  spiritCharge: SpiritCharge;
  onActivate: (element: FoxElement) => void;
}

export function SpiritPanel({ spiritCharge, onActivate }: SpiritPanelProps) {
  return (
    <div className="flex gap-2 w-full max-w-[420px] justify-between">
      {ELEMENTS.map((el) => {
        const def = FOX_DEFS[el];
        const charge = spiritCharge[el];
        const isReady = charge >= SPIRIT_MAX;
        const pct = Math.min(100, (charge / SPIRIT_MAX) * 100);

        return (
          <div
            key={el}
            className="flex flex-col items-center gap-1 flex-1 min-w-0"
          >
            {/* Fox portrait — clickable when charged */}
            <motion.button
              className={cn(
                "w-12 aspect-square rounded-lg flex items-center justify-center text-lg ",
                isReady ? "cursor-pointer" : "cursor-not-allowed opacity-70",
              )}
              animate={{
                boxShadow: isReady
                  ? [
                      `0 0 6px 2px ${def.accentColor}`,
                      `0 0 14px 4px ${def.accentColor}`,
                      `0 0 6px 2px ${def.accentColor}`,
                    ]
                  : "none",
                scale: isReady ? [1, 1.08, 1] : 1,
              }}
              transition={isReady ? { duration: 1.2, repeat: Infinity } : {}}
              onClick={() => isReady && onActivate(el)}
              disabled={!isReady}
            >
              <FoxSprite element={el} className="w-full h-full" />
            </motion.button>

            {/* Charge bar */}
            <div className="w-full h-1.5 rounded-full bg-neutral-700 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
                style={{ backgroundColor: def.accentColor }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
