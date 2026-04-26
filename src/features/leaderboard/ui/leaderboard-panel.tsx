import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "../../../../convex/_generated/api";
import { CoinIcon } from "../../../shared/ui/coin-icon";
import { StarIcon } from "../../../shared/ui/star-icon";
import { Dialog, DialogClose, DialogContent } from "../../../shared/ui/dialog";
import type { LeaderboardEntry } from "../../../shared/types/leaderboard";

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
        className="flex max-h-[80vh] max-w-[min(95vw,28rem)] flex-col gap-4 overflow-hidden rounded-2xl border-border bg-card p-4 text-card-foreground shadow-2xl sm:p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <img src="/fox.svg" alt="" className="h-6" />
            Leaderboard
          </h2>
          <DialogClose
            className="text-xl leading-none text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close leaderboard"
          >
            ✕
          </DialogClose>
        </div>

        <div className="grid grid-cols-[1.5rem_1fr_4.5rem_2.5rem] gap-1.5 px-1 text-xs tracking-wide text-muted-foreground uppercase sm:grid-cols-[2rem_1fr_5rem_3rem_3rem] sm:gap-2">
          <span>#</span>
          <span>Player</span>
          <span className="flex items-center justify-end gap-0.5">
            <CoinIcon className="h-3 w-3" />
            Score
          </span>
          <span className="text-center">Stars</span>
          <span className="hidden text-center sm:block">Mode</span>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto pr-1">
          {scores === undefined && (
            <div className="animate-pulse py-8 text-center text-muted-foreground">
              Loading…
            </div>
          )}
          {scores?.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
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
                  <span className="font-mono text-xs text-muted-foreground">
                    {rank === 1
                      ? "🥇"
                      : rank === 2
                        ? "🥈"
                        : rank === 3
                          ? "🥉"
                          : rank}
                  </span>
                  <span className="truncate font-medium">{entry.nickname}</span>
                  <span className="flex items-center justify-end gap-1 font-bold text-primary tabular-nums">
                    <CoinIcon className="h-3.5 w-3.5" />
                    {entry.score.toLocaleString()}
                  </span>
                  <span className="text-center text-xs text-foreground/80">
                    <StarIcon className="mr-0.5 inline h-3 w-3 align-baseline" />
                    {entry.stars}
                  </span>
                  <span className="hidden text-center text-xs text-muted-foreground sm:block">
                    {entry.mode === "zen" ? "Zen" : "90s"}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Updates in real time
        </p>
      </DialogContent>
    </Dialog>
  );
}
