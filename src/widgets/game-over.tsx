import { motion } from "motion/react";
import { useState } from "react";
import { useNickname, useSubmitScore } from "../features/leaderboard";
import type { GameMode } from "../shared/types/leaderboard";
import { Dialog, DialogContent } from "../shared/ui/dialog";
import { LeaderboardPanel } from "./leaderboard";

interface GameOverBlockProps {
  open: boolean;
  score: number;
  stars: number;
  level: number;
  mode: GameMode;
  onReset: () => void;
}

export const GameOverBlock = ({
  open,
  score,
  stars,
  level,
  mode,
  onReset,
}: GameOverBlockProps) => {
  const { nickname, updateNickname } = useNickname();
  const { submit, status, submittedId, errorMessage } = useSubmitScore();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleSubmit = () => {
    void submit({ nickname, score, stars, level, mode });
  };

  return (
    <>
      {showLeaderboard && (
        <LeaderboardPanel
          open={showLeaderboard}
          highlightId={submittedId}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onReset(); }}>
        <DialogContent
          showCloseButton={false}
          className="bg-neutral-800 text-white border-neutral-700 rounded-2xl max-w-xs sm:max-w-xs flex flex-col items-center gap-4 shadow-2xl"
        >
          <h2 className="text-3xl font-bold">Game Over</h2>
          <p className="text-neutral-400">
            {mode === "zen" ? "Zen session complete!" : "Time's up!"}
          </p>

          <div className="text-center">
            <motion.p
              key={score}
              className="text-4xl font-bold text-yellow-400"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              {score.toLocaleString()}
            </motion.p>
            <p className="text-neutral-400 text-sm">Final Score</p>
          </div>

          <div className="flex gap-6 text-sm text-neutral-300">
            <span>
              <img
                src="/star.svg"
                alt="star"
                className="inline w-4 h-4 mr-1 align-middle"
              />
              {stars} stars
            </span>
            <span>Level {level}</span>
          </div>

          <div className="w-full flex flex-col gap-2">
            {status !== "success" ? (
              <>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => updateNickname(e.target.value)}
                  placeholder="Your nickname"
                  maxLength={24}
                  className="bg-neutral-700 border border-neutral-600 focus:border-yellow-500/60 focus:outline-none rounded-lg px-3 py-1.5 text-sm text-white w-full placeholder-neutral-500 transition-colors"
                />
                {errorMessage && (
                  <p className="text-red-400 text-xs text-center">{errorMessage}</p>
                )}
                <button
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-900 font-bold rounded-lg transition-colors text-sm"
                  onClick={handleSubmit}
                  disabled={status === "submitting" || nickname.trim().length === 0}
                >
                  {status === "submitting" ? "Submitting…" : "Submit to Leaderboard"}
                </button>
              </>
            ) : (
              <>
                <p className="text-green-400 text-sm text-center">Score submitted!</p>
                <button
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-neutral-900 font-bold rounded-lg transition-colors text-sm"
                  onClick={() => setShowLeaderboard(true)}
                >
                  View Leaderboard
                </button>
              </>
            )}

            {status !== "success" && (
              <button
                className="text-xs text-neutral-400 hover:text-neutral-200 transition-colors py-1"
                onClick={() => setShowLeaderboard(true)}
              >
                View Leaderboard
              </button>
            )}
          </div>

          <button
            className="mt-1 px-6 py-2 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-lg transition-colors"
            onClick={onReset}
          >
            Play Again
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
};
