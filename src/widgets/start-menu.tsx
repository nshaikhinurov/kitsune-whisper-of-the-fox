import { Timer, Wind } from "lucide-react";
import type { GameMode } from "~/shared/types/leaderboard";
import { Button } from "~/shared/ui/button";
import { Dialog, DialogContent } from "~/shared/ui/dialog";

interface StartMenuProps {
  open: boolean;
  onStart: (mode: GameMode) => void;
}

export const StartMenu = ({ open, onStart }: StartMenuProps) => {
  return (
    <Dialog open={open} disablePointerDismissal>
      <DialogContent
        showCloseButton={false}
        className="border-border bg-card text-card-foreground flex max-w-[min(90vw,24rem)] flex-col items-center gap-5 rounded-2xl shadow-2xl"
      >
        <div className="flex flex-col items-center gap-2">
          <img src="/imgs/logo-cat.svg" alt="Ori cat" className="h-14" />
          <h2 className="text-3xl font-bold">Выбери режим</h2>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button
            type="button"
            onClick={() => onStart("normal")}
            variant="outline"
            className="flex h-auto w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left whitespace-normal wrap-break-word transition-all outline-none focus-visible:ring-3 active:translate-y-px dark:bg-transparent"
          >
            <span className="flex items-center gap-2 text-lg font-semibold">
              <Timer className="size-5" />
              Стандартный
            </span>
            <span className="text-muted-foreground text-sm">
              Игра на время. Набирай очки, пока не вышел таймер.
            </span>
          </Button>

          <Button
            type="button"
            onClick={() => onStart("zen")}
            variant="outline"
            className="flex h-auto w-full flex-col items-start gap-1 rounded-2xl border p-4 text-left whitespace-normal wrap-break-word transition-all outline-none focus-visible:ring-3 active:translate-y-px dark:bg-transparent"
          >
            <span className="flex items-center gap-2 text-lg font-semibold">
              <Wind className="size-5" />
              Дзен
            </span>
            <span className="text-muted-foreground text-sm">
              Без таймера. Играй в своём темпе и расслабляйся.
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
