import { motion } from "motion/react";

interface HudProps {
  score: number;
  combo: number;
  stars: number;
  level: number;
  onOpenLeaderboard?: () => void;
}

export function Hud({ score, combo, stars, level, onOpenLeaderboard }: HudProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-neutral-800/70 backdrop-blur text-white text-sm font-semibold w-full max-w-[420px] justify-between">
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-neutral-400 text-xs uppercase tracking-wide">
          Score
        </span>
        <motion.span
          key={score}
          className="text-lg font-bold tabular-nums"
          initial={{ scale: 1.3, color: "#facc15" }}
          animate={{ scale: 1, color: "#ffffff" }}
          transition={{ duration: 0.3 }}
        >
          {score.toLocaleString()}
        </motion.span>
        <motion.span
          key={combo}
          className="text-yellow-400 text-xs font-bold"
          animate={{
            scale: combo > 1 ? [1.5, 1] : 1,
            opacity: combo > 1 ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          style={{ visibility: combo > 1 ? "visible" : "hidden" }}
        >
          ×{combo} combo!
        </motion.span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-neutral-400 text-xs uppercase tracking-wide">
          Stars
        </span>
        <motion.span
          key={stars}
          className="text-lg font-bold tabular-nums "
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.25 }}
        >
          <img
            src="/star.svg"
            alt="star"
            className="inline w-4 h-4 mr-1 align-baseline"
          />
          {stars}
        </motion.span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-neutral-400 text-xs uppercase tracking-wide">
          Level
        </span>
        <span className="text-lg font-bold">{level}</span>
      </div>

      {onOpenLeaderboard && (
        <button
          onClick={onOpenLeaderboard}
          className="text-neutral-400 hover:text-yellow-400 transition-colors text-xl leading-none"
          title="Leaderboard"
          aria-label="Open leaderboard"
        >
          🏆
        </button>
      )}
    </div>
  );
}
