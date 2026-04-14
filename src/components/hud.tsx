import { AnimatePresence, motion } from "motion/react";

interface HudProps {
  score: number;
  combo: number;
  movesLeft: number;
  gems: number;
  level: number;
}

export function Hud({ score, combo, movesLeft, gems, level }: HudProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-800/70 backdrop-blur text-white text-sm font-semibold w-full max-w-[420px] justify-between">
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Score</span>
        <motion.span
          key={score}
          className="text-lg font-bold tabular-nums"
          initial={{ scale: 1.3, color: "#facc15" }}
          animate={{ scale: 1, color: "#ffffff" }}
          transition={{ duration: 0.3 }}
        >
          {score.toLocaleString()}
        </motion.span>
        <AnimatePresence>
          {combo > 1 && (
            <motion.span
              key={combo}
              className="text-yellow-400 text-xs font-bold"
              initial={{ scale: 1.5, opacity: 0, y: -4 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              ×{combo} combo!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Moves</span>
        <motion.span
          key={movesLeft}
          className={[
            "text-lg font-bold tabular-nums",
            movesLeft <= 5 ? "text-red-400" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          animate={movesLeft <= 5 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          {movesLeft}
        </motion.span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Gems</span>
        <motion.span
          key={gems}
          className="text-lg font-bold tabular-nums text-blue-400"
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          💎 {gems}
        </motion.span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wide">Level</span>
        <span className="text-lg font-bold">{level}</span>
      </div>
    </div>
  );
}
