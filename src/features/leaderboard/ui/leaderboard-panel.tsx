import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "../../../../convex/_generated/api";
import type { LeaderboardEntry } from "../../../shared/types/leaderboard";
import { CoinIcon } from "../../../shared/ui/coin-icon";
import { Dialog, DialogClose, DialogContent } from "../../../shared/ui/dialog";
import { HeartIcon } from "../../../shared/ui/heart-icon";

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
      <DialogContent
        showCloseButton={false}
        className="border-border bg-card text-card-foreground flex max-h-[80vh] max-w-[min(95vw,28rem)] flex-col gap-4 overflow-hidden rounded-2xl p-4 shadow-2xl sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <img src="/ori-cat.svg" alt="" className="h-6" />
            Leaderboard
          </h2>
          <DialogClose
            className="text-muted-foreground hover:text-foreground text-xl leading-none transition-colors"
            aria-label="Close leaderboard"
          >
            ✕
          </DialogClose>
        </div>

        <div className="text-muted-foreground grid grid-cols-[1.5rem_1fr_4.5rem_2.5rem] gap-1.5 px-1 text-xs tracking-wide uppercase sm:grid-cols-[2rem_1fr_5rem_3rem_3rem] sm:gap-2">
          <span>#</span>
          <span>Player</span>
          <span className="flex items-center justify-end gap-0.5">
            <CoinIcon className="h-3 w-3" />
            Score
          </span>
          <span className="text-center">Hearts</span>
          <span className="hidden text-center sm:block">Mode</span>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          {scores === undefined && (
            <div className="text-muted-foreground animate-pulse py-8 text-center">
              Loading…
            </div>
          )}
          {scores?.length === 0 && (
            <div className="text-muted-foreground py-8 text-center">
              No scores yet — be the first!
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
                  className={`grid grid-cols-[1.5rem_1fr_4.5rem_2.5rem] items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors sm:grid-cols-[2rem_1fr_5rem_3rem_3rem] sm:gap-2 ${
                    isHighlighted
                      ? "border border-yellow-500/40 bg-yellow-500/20"
                      : "hover:bg-muted/50"
                  }`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-muted-foreground font-mono text-xs">
                    {rank === 1
                      ? "🥇"
                      : rank === 2
                        ? "🥈"
                        : rank === 3
                          ? "🥉"
                          : rank}
                  </span>
                  <span className="truncate font-medium">{entry.nickname}</span>
                  <span className="text-primary flex items-center justify-end gap-1 font-bold tabular-nums">
                    <CoinIcon className="h-3.5 w-3.5" />
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="text-foreground/80 text-center text-xs">
                    <HeartIcon className="mr-0.5 inline h-3 w-3 align-baseline" />
                    {entry.hearts}
                  </span>
                  <span className="text-muted-foreground hidden text-center text-xs sm:block">
                    {entry.mode === "zen" ? "Zen" : "90s"}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Updates in real time
        </p>
      </DialogContent>
    </Dialog>
  );
}
