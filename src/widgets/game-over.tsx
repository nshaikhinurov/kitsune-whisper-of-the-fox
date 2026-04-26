import { motion } from "motion/react";
import { useState } from "react";
import { useNickname, useSubmitScore } from "../features/leaderboard";
import type { GameMode } from "../shared/types/leaderboard";
import { Button } from "../shared/ui/button";
import { Dialog, DialogContent } from "../shared/ui/dialog";
import { Input } from "../shared/ui/input";
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

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onReset();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="flex max-w-[min(90vw,22rem)] flex-col items-center gap-4 rounded-2xl border-neutral-700 bg-neutral-800 text-white shadow-2xl"
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
            <p className="text-sm text-neutral-400">Final Score</p>
          </div>

          <div className="flex gap-6 text-sm text-neutral-300">
            <span>
              <img
                src="/star.svg"
                alt="star"
                className="mr-1 inline h-4 w-4 align-middle"
              />
              {stars} stars
            </span>
            <span>Level {level}</span>
          </div>

          <div className="flex w-full flex-col gap-2">
            {status !== "success" ? (
              <>
                <Input
                  type="text"
                  value={nickname}
                  onChange={(e) => updateNickname(e.target.value)}
                  placeholder="Your nickname"
                  maxLength={24}
                />
                {errorMessage && (
                  <p className="text-center text-xs text-red-400">
                    {errorMessage}
                  </p>
                )}
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={
                    status === "submitting" || nickname.trim().length === 0
                  }
                >
                  {status === "submitting"
                    ? "Submitting…"
                    : "Submit to Leaderboard"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-center text-sm text-green-400">
                  Score submitted!
                </p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setShowLeaderboard(true)}
                >
                  View Leaderboard
                </Button>
              </>
            )}

            {status !== "success" && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowLeaderboard(true)}
              >
                View Leaderboard
              </Button>
            )}
          </div>

          <Button className="mt-1 w-full" onClick={onReset}>
            Play Again
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
