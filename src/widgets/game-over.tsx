import { motion } from "motion/react";
import { useState } from "react";
import {
  LeaderboardPanel,
  useNickname,
  useSubmitScore,
} from "../features/leaderboard";
import type { GameMode } from "../shared/types/leaderboard";
import { Button } from "../shared/ui/button";
import { CoinIcon } from "../shared/ui/coin-icon";
import { Dialog, DialogContent } from "../shared/ui/dialog";
import { HeartIcon } from "../shared/ui/heart-icon";
import { Input } from "../shared/ui/input";

interface GameOverBlockProps {
  open: boolean;
  score: number;
  hearts: number;
  mode: GameMode;
  reason?: "time" | "deadlock";
  onReset: () => void;
}

const DEADLOCK_JOKES = [
  "The cats checked every tile — twice. Even the spirits gave up.",
  "Congratulations! You've discovered a board state mathematically guaranteed to have zero moves. Science.",
  "A perfectly arranged prison. Not one swap leads anywhere. The universe wins.",
  "The board looked at itself in the mirror and decided: nope, no moves today.",
];

function pickDeadlockJoke() {
  return DEADLOCK_JOKES[Math.floor(Math.random() * DEADLOCK_JOKES.length)];
}

export const GameOverBlock = ({
  open,
  score,
  hearts,
  mode,
  reason = "time",
  onReset,
}: GameOverBlockProps) => {
  const { nickname, updateNickname } = useNickname();
  const { submit, status, submittedId, errorMessage } = useSubmitScore();
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const handleSubmit = () => {
    void submit({ nickname, score, hearts, mode });
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
          className="border-border bg-card text-card-foreground flex max-w-[min(90vw,22rem)] flex-col items-center gap-4 rounded-2xl shadow-2xl"
        >
          <h2 className="font-sushi text-4xl">
            {reason === "deadlock" ? "Deadlock!" : "Time's up"}
          </h2>

          {reason === "deadlock" && (
            <p className="text-muted-foreground text-center text-sm italic">
              {pickDeadlockJoke()}
            </p>
          )}

          <div className="flex justify-between gap-10">
            <motion.p
              key={score}
              className="text-primary font-sushi flex items-center gap-1 text-4xl"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <CoinIcon className="size-8" />
              {score.toLocaleString()}
            </motion.p>

            <motion.p
              key={score}
              className="font-sushi flex items-center gap-1 text-4xl text-heart"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            >
              <HeartIcon className="size-8" />
              {hearts}
            </motion.p>
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
                  <p className="text-destructive text-center text-xs">
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
