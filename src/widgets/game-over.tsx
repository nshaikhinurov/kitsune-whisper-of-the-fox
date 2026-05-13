import { motion } from "motion/react";
import { useEffect } from "react";
import { Audition } from "~/shared/lib/audition";
import type { GameMode } from "~/shared/types/leaderboard";
import { Button } from "~/shared/ui/button";
import { CoinIcon } from "~/shared/ui/coin-icon";
import { Dialog, DialogContent } from "~/shared/ui/dialog";
import { HeartIcon } from "~/shared/ui/heart-icon";
import { Input } from "~/shared/ui/input";
import {
  LeaderboardPanel,
  useNickname,
  useSubmitScore,
} from "../features/leaderboard";

interface GameOverBlockProps {
  open: boolean;
  score: number;
  hearts: number;
  mode: GameMode;
  reason?: "time" | "deadlock";
  onReset: () => void;
}

const DEADLOCK_JOKES = [
  "Коты проверили каждую клетку — дважды. Даже духи сдались.",
  "Поздравляем! Вы обнаружили состояние поля, математически гарантированно лишённое ходов. Наука.",
  "Идеально упорядоченная тюрьма. Ни один обмен никуда не ведёт. Вселенная побеждает.",
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
  const { submit, reset, status, submittedId, errorMessage } = useSubmitScore();
  const showLeaderboard = status === "success";

  useEffect(() => {
    if (open) {
      reset();
      if (reason === "time") Audition.timerEnded();
    }
  }, [open, reason, reset]);

  const handleSubmit = () => {
    void submit({ nickname, score, hearts, mode });
  };

  return (
    <>
      {showLeaderboard && (
        <LeaderboardPanel
          open={showLeaderboard}
          highlightId={submittedId}
          onClose={() => { reset(); onReset(); }}
        />
      )}

      <Dialog
        open={open}
        disablePointerDismissal
        onOpenChange={(isOpen) => {
          if (!isOpen) onReset();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="border-border bg-card text-card-foreground flex max-w-[min(90vw,22rem)] flex-col items-center gap-4 rounded-2xl shadow-2xl"
        >
          <h2 className="text-4xl font-bold">
            {reason === "deadlock" ? "Тупик!" : "Время вышло"}
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
              className="font-sushi text-heart flex items-center gap-1 text-4xl"
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
                  placeholder="Твой никнейм"
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
                    status === "submitting" || nickname.trim().length === 0 || score === 0
                  }
                >
                  {status === "submitting"
                    ? "Отправка…"
                    : "Добавить в таблицу лидеров"}
                </Button>
              </>
            ) : (
              <p className="text-center text-sm text-green-400">
                Результат сохранён!
              </p>
            )}
          </div>

          <Button className="mt-1 w-full" onClick={onReset}>
            Играть снова
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
