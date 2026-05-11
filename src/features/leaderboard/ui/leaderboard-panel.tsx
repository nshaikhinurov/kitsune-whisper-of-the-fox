import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import type { LeaderboardEntry } from "~/shared/types/leaderboard";
import { CoinIcon } from "~/shared/ui/coin-icon";
import { Dialog, DialogContent } from "~/shared/ui/dialog";
import { HeartIcon } from "~/shared/ui/heart-icon";
import { api } from "../../../../convex/_generated/api";

interface LeaderboardPanelProps {
  open: boolean;
  onClose: () => void;
  highlightId?: string | null;
}

export function LeaderboardPanel({
  open,
  onClose,
  highlightId,
}: LeaderboardPanelProps) {
  const scores = useQuery(api.leaderboard.getTopScores, open ? {} : "skip");

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="border-border bg-card text-card-foreground flex max-h-[80vh] max-w-[min(95vw,32rem)] flex-col gap-4 overflow-hidden rounded-2xl p-4 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-baseline gap-2 text-3xl font-bold">
            <img src="/imgs/ori-cat.svg" alt="" className="h-6" />
            Таблица лидеров
          </h2>
        </div>

        <div className="text-muted-foreground grid grid-cols-[1.5rem_1fr_4.5rem_2.5rem] gap-1.5 px-1 text-sm tracking-wide uppercase sm:grid-cols-[1rem_1fr_5rem_5rem_3rem] sm:gap-2">
          <span className="text-right">#</span>
          <span>Игрок</span>
          <span className="flex items-center justify-end gap-0.5">
            <CoinIcon className="h-3 w-3" />
            Очки
          </span>
          <span className="text-center">Сердечки</span>
          <span className="hidden text-center sm:block">Режим</span>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          {scores === undefined && (
            <div className="text-muted-foreground animate-pulse py-8 text-center">
              Загрузка…
            </div>
          )}
          {scores?.length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              Результатов пока нет — будь первым!
            </div>
          )}
          <AnimatePresence initial={false}>
            {scores?.map((entry: LeaderboardEntry, idx: number) => {
              const isHighlighted =
                highlightId != null && entry._id === highlightId;
              const rank = idx + 1;
              return (
                <motion.div
                  key={entry._id}
                  layout
                  className={`grid grid-cols-[1.5rem_1fr_4.5rem_2.5rem] items-center gap-1.5 rounded-lg px-1 py-1.5 text-sm tabular-nums transition-colors sm:grid-cols-[1rem_1fr_5rem_5rem_3rem] sm:gap-2 ${
                    isHighlighted
                      ? "border border-yellow-500/40 bg-yellow-500/20"
                      : "hover:bg-muted/50"
                  }`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-muted-foreground text-right font-mono text-xs">
                    {rank === 1
                      ? "🥇"
                      : rank === 2
                        ? "🥈"
                        : rank === 3
                          ? "🥉"
                          : rank}
                  </span>
                  <span className="truncate font-medium">{entry.nickname}</span>
                  <span className="text-primary flex items-center justify-end gap-1 font-bold">
                    <CoinIcon className="size-3.5" />
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="text-heart flex items-center justify-end gap-1 font-bold">
                    <HeartIcon className="size-3.5" />
                    {entry.hearts}
                  </span>
                  <span className="text-muted-foreground hidden text-center text-xs sm:block">
                    {entry.mode === "zen" ? "Дзен" : "90с"}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Обновляется в реальном времени
        </p>
      </DialogContent>
    </Dialog>
  );
}
