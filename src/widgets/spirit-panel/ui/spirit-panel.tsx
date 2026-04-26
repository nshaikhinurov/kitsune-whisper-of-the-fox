import { motion } from "motion/react";
import { FOX_DEFS, FoxSprite } from "../../../entities/fox";
import { ELEMENTS, SPIRIT_MAX } from "../../../shared/config/game-config";
import { cn } from "../../../shared/lib/utils";
import type { FoxElement, SpiritCharge } from "../../../shared/types/game";
import { Avatar, AvatarFallback } from "../../../shared/ui/avatar";

interface SpiritPanelProps {
  spiritCharge: SpiritCharge;
  onActivate: (element: FoxElement) => void;
}

export function SpiritPanel({ spiritCharge, onActivate }: SpiritPanelProps) {
  return (
    <div className="flex w-[min(90vw,800px)] justify-around gap-2 px-6 py-3 lg:h-full lg:gap-5 lg:py-9">
      {ELEMENTS.map((el) => {
        const def = FOX_DEFS[el];
        const charge = spiritCharge[el];
        const isReady = charge >= SPIRIT_MAX;
        const pct = Math.min(100, (charge / SPIRIT_MAX) * 100);

        return (
          <div
            key={el}
            className="flex flex-col items-center gap-1.5 lg:h-20 lg:gap-3"
          >
            <motion.button
              className={cn(
                "rounded-full border-0 bg-transparent p-0",
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
              <Avatar className="size-10 sm:size-12 lg:size-20">
                <AvatarFallback className="bg-transparent p-0.5">
                  <FoxSprite element={el} className="aspect-square w-8/10" />
                </AvatarFallback>
              </Avatar>
            </motion.button>

            <div className="flex h-1.5 w-10 overflow-hidden rounded-full bg-neutral-700 sm:w-12">
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
