import { AnimatePresence, motion } from "motion/react";
import { GAME_DURATION_MS } from "../constants";

interface HudProps {
  score: number;
  combo: number;
  timeLeft: number;
  gems: number;
  level: number;
}

export function Hud({ score, combo, timeLeft, gems, level }: HudProps) {
  const secondsLeft = Math.ceil(timeLeft / 1000);
  const pct = timeLeft / GAME_DURATION_MS;
  const isLow = timeLeft <= 10_000;
  const isWarning = timeLeft <= 30_000;

  const barColor = isLow
    ? "#f87171"   // red-400
    : isWarning
    ? "#facc15"   // yellow-400
    : "#4ade80";  // green-400

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

      {/* Timer progress bar */}
      <div className="flex flex-col items-center gap-1 flex-1 min-w-0 px-2">
        <div className="flex items-center justify-between w-full">
          <span className="text-slate-400 text-xs uppercase tracking-wide">Time</span>
          <motion.span
            key={secondsLeft}
            className="text-xs font-bold tabular-nums"
            style={{ color: barColor }}
            animate={isLow ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {secondsLeft}s
          </motion.span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: barColor }}
            animate={{ width: `${Math.max(0, pct * 100)}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
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
