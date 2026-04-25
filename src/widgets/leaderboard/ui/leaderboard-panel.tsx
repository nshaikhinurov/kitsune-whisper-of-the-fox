import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "../../../../convex/_generated/api";
import type { LeaderboardEntry } from "../../../shared/types/leaderboard";

interface LeaderboardPanelProps {
  onClose: () => void;
  highlightId?: string | null;
}

export function LeaderboardPanel({ onClose, highlightId }: LeaderboardPanelProps) {
  const scores = useQuery(api.leaderboard.getTopScores);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-neutral-800 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl text-white w-full max-w-md mx-4 max-h-[80vh] overflow-hidden"
        initial={{ scale: 0.7, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <img src="/fox.svg" alt="" className="h-6" />
            Leaderboard
          </h2>
          <button
            className="text-neutral-400 hover:text-white transition-colors text-xl leading-none"
            onClick={onClose}
            aria-label="Close leaderboard"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-[2rem_1fr_5rem_3rem_3rem] gap-2 text-xs text-neutral-400 uppercase tracking-wide px-1">
          <span>#</span>
          <span>Player</span>
          <span className="text-right">Score</span>
          <span className="text-center">Stars</span>
          <span className="text-center">Mode</span>
        </div>

        <div className="overflow-y-auto flex flex-col gap-1 pr-1">
          {scores === undefined && (
            <div className="text-center text-neutral-400 py-8 animate-pulse">
              Loading…
            </div>
          )}
          {scores?.length === 0 && (
            <div className="text-center text-neutral-400 py-8">
              No scores yet — be the first!
            </div>
          )}
          <AnimatePresence initial={false}>
            {scores?.map((entry: LeaderboardEntry, idx: number) => {
              const isHighlighted = highlightId != null && entry._id === highlightId;
              const rank = idx + 1;
              return (
                <motion.div
                  key={entry._id}
                  layout
                  className={`grid grid-cols-[2rem_1fr_5rem_3rem_3rem] gap-2 items-center px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    isHighlighted
                      ? "bg-yellow-500/20 border border-yellow-500/40"
                      : "hover:bg-neutral-700/50"
                  }`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-neutral-400 text-xs font-mono">
                    {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
                  </span>
                  <span className="font-medium truncate">{entry.nickname}</span>
                  <span className="text-right font-bold text-yellow-400 tabular-nums">
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="text-center text-neutral-300 text-xs">
                    <img
                      src="/star.svg"
                      alt="star"
                      className="inline w-3 h-3 mr-0.5 align-baseline"
                    />
                    {entry.stars}
                  </span>
                  <span className="text-center text-xs text-neutral-400">
                    {entry.mode === "zen" ? "Zen" : "90s"}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <p className="text-xs text-neutral-500 text-center">
          Updates in real time
        </p>
      </motion.div>
    </motion.div>
  );
}
