import { motion } from "motion/react";
import { ELEMENTS, FOX_DEFS, SPIRIT_MAX } from "../constants";
import type { FoxElement, SpiritCharge } from "../types";

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
          <div key={el} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            {/* Fox portrait — clickable when charged */}
            <motion.button
              className={[
                "w-9 h-9 rounded-lg flex items-center justify-center text-lg border-2",
                isReady ? "cursor-pointer" : "cursor-not-allowed opacity-70",
              ]
                .filter(Boolean)
                .join(" ")}
              animate={{
                boxShadow: isReady
                  ? [`0 0 6px 2px ${def.accentColor}`, `0 0 14px 4px ${def.accentColor}`, `0 0 6px 2px ${def.accentColor}`]
                  : "none",
                scale: isReady ? [1, 1.08, 1] : 1,
              }}
              transition={isReady ? { duration: 1.2, repeat: Infinity } : {}}
              style={{
                backgroundColor: def.bgColor,
                borderColor: def.borderColor,
                color: def.textColor,
              }}
              onClick={() => isReady && onActivate(el)}
              disabled={!isReady}
            >
              {def.emoji}
            </motion.button>

            {/* Charge bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
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
