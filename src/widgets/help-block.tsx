import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FOX_DEFS } from "../entities/fox";
import { ELEMENTS } from "../shared/config/game-config";
import { Button } from "../shared/ui/button";

export const HelpBlock = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="w-full max-w-105">
      <Button
        variant="ghost"
        size="xs"
        className="text-neutral-400 hover:text-neutral-200 gap-1"
        onClick={() => setShowHelp((v) => !v)}
      >
        <span>{showHelp ? "▾" : "▸"}</span>
        <span>Spirit abilities</span>
      </Button>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="mt-1 rounded-lg bg-neutral-800/70 backdrop-blur px-3 py-2 flex flex-col gap-1.5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {ELEMENTS.map((el) => {
              const def = FOX_DEFS[el];
              return (
                <div
                  key={el}
                  className="flex items-start gap-2 text-xs text-neutral-300"
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-sm"
                    style={{
                      color: def.textColor,
                    }}
                  ></span>
                  <span>
                    <span
                      className="font-semibold"
                      style={{ color: def.accentColor }}
                    >
                      {def.name}
                    </span>
                    {" — "}
                    {def.ultDescription}
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
