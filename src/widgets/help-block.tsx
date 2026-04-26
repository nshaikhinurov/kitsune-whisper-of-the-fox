import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { FOX_DEFS } from "../entities/fox";
import { ELEMENTS } from "../shared/config/game-config";
import { Button } from "../shared/ui/button";

export const HelpBlock = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        size="xs"
        className="gap-1 text-neutral-400 hover:text-neutral-200"
        onClick={() => setShowHelp((v) => !v)}
      >
        <span>{showHelp ? "▾" : "▸"}</span>
        <span>Spirit abilities</span>
      </Button>

      <AnimatePresence>
        {showHelp && (
          <motion.div
            className="mt-1 flex flex-col gap-1.5 rounded-lg bg-neutral-800/70 px-3 py-2 backdrop-blur"
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
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-sm"
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
