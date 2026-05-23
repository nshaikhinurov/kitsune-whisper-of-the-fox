import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { cn } from "~/shared/lib/utils";
import type {
  GameMode,
  LeaderboardEntry,
  RankContext,
} from "~/shared/types/leaderboard";
import { Badge } from "~/shared/ui/badge";
import { CoinIcon } from "~/shared/ui/coin-icon";
import { CrownIcon } from "~/shared/ui/crown-icon";
import { Dialog, DialogContent } from "~/shared/ui/dialog";
import { HeartIcon } from "~/shared/ui/heart-icon";
import { ScrollArea } from "~/shared/ui/scroll-area";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

interface LeaderboardPanelProps {
  open: boolean;
  onClose: () => void;
  highlightId?: string | null;
  mode: GameMode;
}

function LeaderboardRow({
  entry,
  rank,
  isHighlighted,
  rowRef,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isHighlighted: boolean;
  rowRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={rowRef}
      className={cn(
        "grid min-h-11 grid-cols-[1.5rem_1fr_5rem_5rem] items-center gap-3 rounded-lg px-3 py-2 tabular-nums transition-colors",
        {
          "bg-yellow-400/25 inset-ring-3 inset-ring-yellow-400": rank === 1,
          "bg-neutral-400/25 inset-ring-3 inset-ring-neutral-400": rank === 2,
          "bg-amber-700/25 inset-ring-3 inset-ring-amber-700": rank === 3,
          "hover:bg-muted/50": rank > 3 && !isHighlighted,
          "bg-yellow-500/20 inset-ring inset-ring-yellow-500/40": isHighlighted,
        },
      )}
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
      <span className="truncate font-medium">{entry.nickname}</span>
      <span className="flex items-center justify-end gap-2 font-bold">
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
    </div>
  );
}

function Ellipsis() {
  return (
    <div className="text-muted-foreground py-1 text-center text-lg leading-none font-extrabold tracking-widest select-none">
      ⋮
    </div>
  );
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

  // Only relevant for a just-submitted run that landed outside the top 20.
  const rankContext = useQuery(
    api.leaderboard.getRankContext,
    open && highlightId
      ? { entryId: highlightId as Id<"leaderboard">, mode }
      : "skip",
  ) as RankContext | null | undefined;

  const highlightedRowRef = useRef<HTMLDivElement | null>(null);
  const hasHighlightInTop =
    highlightId != null &&
    !!scores?.some((entry) => entry._id === highlightId);
  const hasHighlightInContext =
    highlightId != null &&
    !!rankContext?.slice.some(({ entry }) => entry._id === highlightId);
  const canScroll = open && (hasHighlightInTop || hasHighlightInContext);

  useEffect(() => {
    if (!canScroll) return;
    const node = highlightedRowRef.current;
    if (!node) return;
    const raf = requestAnimationFrame(() => {
      node.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [canScroll]);

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

        <ScrollArea className="flex flex-col overflow-y-auto p-1">
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
                return (
                  <motion.div
                    key={entry._id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <LeaderboardRow
                      entry={entry}
                      rank={idx + 1}
                      isHighlighted={isHighlighted}
                      rowRef={isHighlighted ? highlightedRowRef : undefined}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {rankContext && rankContext.slice.length > 0 && (
              <>
                {rankContext.hasGapAbove && <Ellipsis />}
                {rankContext.slice.map(({ rank, entry }) => {
                  const isHighlighted =
                    highlightId != null && entry._id === highlightId;
                  return (
                    <LeaderboardRow
                      key={entry._id}
                      entry={entry}
                      rank={rank}
                      isHighlighted={isHighlighted}
                      rowRef={isHighlighted ? highlightedRowRef : undefined}
                    />
                  );
                })}
                {rankContext.hasMoreBelow && <Ellipsis />}
              </>
            )}
          </div>
        </ScrollArea>

        <p className="text-muted-foreground text-center text-xs">
          Обновляется в реальном времени
        </p>
      </DialogContent>
    </Dialog>
  );
}
