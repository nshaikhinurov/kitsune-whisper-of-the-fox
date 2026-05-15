import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "~/shared/lib/utils";
import type { GameMode, LeaderboardEntry } from "~/shared/types/leaderboard";
import { Badge } from "~/shared/ui/badge";
import { CoinIcon } from "~/shared/ui/coin-icon";
import { CrownIcon } from "~/shared/ui/crown-icon";
import { Dialog, DialogContent } from "~/shared/ui/dialog";
import { HeartIcon } from "~/shared/ui/heart-icon";
import { ScrollArea } from "~/shared/ui/scroll-area";
import { api } from "../../../../convex/_generated/api";

interface LeaderboardPanelProps {
  open: boolean;
  onClose: () => void;
  highlightId?: string | null;
  mode: GameMode;
}

export function LeaderboardPanel({
  open,
  onClose,
  highlightId,
  mode,
}: LeaderboardPanelProps) {
  const scores = useQuery(
    api.leaderboard.getTopScores,
    open ? { mode } : "skip",
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="border-border bg-card text-card-foreground flex max-h-[80vh] max-w-[min(95vw,32rem)]! flex-col gap-4 overflow-hidden rounded-2xl p-4 text-base shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <img src="/imgs/ori-cat.svg" alt="" className="h-6" />
            Таблица лидеров
            {mode === "zen" && <Badge variant="default">Дзен</Badge>}
          </h2>
        </div>

        <ScrollArea className="flex flex-col overflow-y-auto pr-1">
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
          <div className="flex flex-col gap-1 pr-1">
            <AnimatePresence initial={false}>
              {scores?.map((entry: LeaderboardEntry, idx: number) => {
                const isHighlighted =
                  highlightId != null && entry._id === highlightId;
                const rank = idx + 1;
                return (
                  <motion.div
                    key={entry._id}
                    layout
                    className={cn(
                      "grid min-h-11 grid-cols-[1.5rem_1fr_5rem_5rem] items-center gap-3 rounded-lg px-3 py-2 tabular-nums transition-colors",
                      {
                        "bg-yellow-400/25 inset-ring-3 inset-ring-yellow-400":
                          rank === 1,
                        "bg-neutral-400/25 inset-ring-3 inset-ring-neutral-400":
                          rank === 2,
                        "bg-amber-700/25 inset-ring-3 inset-ring-amber-700":
                          rank === 3,
                        "hover:bg-muted/50": rank > 3 && !isHighlighted,
                        "border border-yellow-500/40 bg-yellow-500/20":
                          isHighlighted,
                      },
                    )}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <span
                      className={cn(
                        "text-muted-foreground flex items-center justify-end text-lg font-extrabold",
                        {
                          "text-yellow-500 dark:text-yellow-400": rank === 1,
                          "text-neutral-500 dark:text-neutral-400": rank === 2,
                          "text-amber-700": rank === 3,
                        },
                      )}
                    >
                      {rank <= 3 ? <CrownIcon className="size-5" /> : rank}
                    </span>
                    <span className="truncate font-medium">
                      {entry.nickname}
                    </span>
                    <span
                      className={
                        "flex items-center justify-end gap-2 font-bold"
                      }
                    >
                      <CoinIcon className="size-5" />
                      {entry.score.toLocaleString()}
                    </span>
                    <span
                      className={cn(
                        "flex items-center justify-end gap-2 font-bold",
                        rank > 3 && "text-heart",
                      )}
                    >
                      <HeartIcon className="size-5" />
                      {entry.hearts}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <p className="text-muted-foreground text-center text-xs">
          Обновляется в реальном времени
        </p>
      </DialogContent>
    </Dialog>
  );
}
