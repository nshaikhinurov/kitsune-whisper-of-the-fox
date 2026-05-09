import { Moon, Settings, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SHOW_HINTS_INITIALLY,
  ZEN_MODE_ON_INITIALLY,
} from "~/shared/config/game-config";
import { startThemeTransition } from "~/shared/lib/theme-transition";
import { Button } from "~/shared/ui/button";
import { TimerBar } from "~/widgets/timer-bar";
import {
  useDarkMode,
  useThemeTransitionActive,
} from "../features/dark-mode/use-dark-mode";
import { useGameState } from "../features/game-session";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../shared/ui/dropdown-menu";
import { Switch } from "../shared/ui/switch";
import { Board } from "../widgets/game-board";
import { Hud } from "../widgets/game-hud";
import { GameOverBlock } from "../widgets/game-over";
import { SpiritPanel } from "../widgets/spirit-panel";

export function MainPage() {
  const [showHints, setShowHints] = useState(SHOW_HINTS_INITIALLY);
  const [zenMode, setZenMode] = useState(ZEN_MODE_ON_INITIALLY);
  const [darkMode, setDarkMode] = useDarkMode();
  const themeTransitioning = useThemeTransitionActive();

  const [menuOpen, setMenuOpen] = useState(false);
  const pendingMenuCloseRef = useRef(false);
  useEffect(() => {
    if (!themeTransitioning && pendingMenuCloseRef.current) {
      pendingMenuCloseRef.current = false;
      setMenuOpen(false);
    }
  }, [themeTransitioning]);
  const handleMenuOpenChange = (open: boolean) => {
    if (!open && themeTransitioning) {
      pendingMenuCloseRef.current = true;
      return;
    }
    setMenuOpen(open);
  };

  const { state, swipeSwap, setDragSource, activateUlt, resetGame } =
    useGameState(zenMode);

  const effectiveDark = darkMode !== state.isNight;
  const firstRun = useRef(true);
  useEffect(() => {
    const apply = () => {
      document.documentElement.classList.toggle("dark", effectiveDark);
    };
    if (firstRun.current) {
      firstRun.current = false;
      apply();
      return;
    }
    startThemeTransition(apply);
  }, [effectiveDark]);

  return (
    <main
      style={
        {
          "--dot-spacing": "40px",
          "--dot-size": "1.5px",
          "--dot-color":
            "color-mix(in oklab, var(--foreground) 10%, transparent)",
        } as React.CSSProperties
      }
      className="bg-background text-foreground relative min-h-screen bg-[radial-gradient(circle,var(--dot-color)_var(--dot-size),transparent_calc(var(--dot-size)+0.5px))] bg-size-[var(--dot-spacing)_var(--dot-spacing)] p-3 md:p-8 xl:p-16"
    >
      <div className="mx-auto flex max-w-150 flex-col items-center justify-start gap-4 md:gap-8 lg:max-w-200">
        <div className="flex w-full items-center justify-center">
          <h1 className="flex h-[1em] items-center gap-[0.4em] text-2xl font-bold tracking-tight sm:text-3xl md:text-5xl">
            <img src="/ori-cat.svg" alt="Spirit" className="h-full shrink-0" />
            <span className="hidden truncate sm:inline">
              Nyota Paka: Purrrfect Match
            </span>
            <span className="sm:hidden">Nyota Paka</span>
          </h1>
          <DropdownMenu open={menuOpen} onOpenChange={handleMenuOpenChange}>
            <DropdownMenuTrigger
              className="absolute top-3 right-3"
              render={
                <Button variant={"ghost"} size={"icon-lg"}>
                  <Settings className="size-6" />
                </Button>
              }
            />
            <DropdownMenuContent
              align="end"
              className="[view-transition-name:settings-menu]"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  closeOnClick={false}
                  onClick={() => setZenMode((v) => !v)}
                  className="justify-between"
                >
                  Zen mode
                  <Switch
                    checked={zenMode}
                    onCheckedChange={setZenMode}
                    onClick={(e) => e.stopPropagation()}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  closeOnClick={false}
                  onClick={() => setShowHints((v) => !v)}
                  className="justify-between"
                >
                  Show hints
                  <Switch
                    checked={showHints}
                    onCheckedChange={setShowHints}
                    onClick={(e) => e.stopPropagation()}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem
                  closeOnClick={false}
                  disabled={themeTransitioning}
                  onClick={() => setDarkMode((v) => !v)}
                  className="justify-between"
                >
                  <span className="flex items-center gap-2">
                    {darkMode ? (
                      <Moon className="size-4" />
                    ) : (
                      <Sun className="size-4" />
                    )}
                    Dark mode
                  </span>
                  <Switch
                    checked={darkMode}
                    readOnly={themeTransitioning}
                    onCheckedChange={setDarkMode}
                    onClick={(e) => e.stopPropagation()}
                  />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Hud score={state.score} combo={state.combo} hearts={state.hearts} />

        <div className="flex w-full flex-col items-center gap-3">
          <Board
            board={state.board}
            selected={state.selected}
            hintPositions={showHints ? state.hintPositions : null}
            scoreFlash={state.scoreFlash}
            onSwipe={swipeSwap}
            onDragSource={setDragSource}
          />

          <SpiritPanel
            spiritCharge={state.spiritCharge}
            onActivate={activateUlt}
          />

          {!zenMode && <TimerBar timeLeft={state.timeLeft} />}
        </div>

        <GameOverBlock
          open={state.phase === "gameOver"}
          score={state.score}
          hearts={state.hearts}
          mode={zenMode ? "zen" : "normal"}
          reason={state.gameOverReason}
          onReset={resetGame}
        />
      </div>
    </main>
  );
}
