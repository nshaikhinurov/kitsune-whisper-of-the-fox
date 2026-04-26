import { Moon, Settings, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { LeaderboardPanel } from "~/features/leaderboard";
import {
  SHOW_HINTS_INITIALLY,
  ZEN_MODE_ON_INITIALLY,
} from "~/shared/config/game-config";
import { Button } from "~/shared/ui/button";
import { TimerBar } from "~/widgets/timer-bar";
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
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("kitsune_dark_mode") !== "false",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("kitsune_dark_mode", String(darkMode));
  }, [darkMode]);
  const { state, swipeSwap, setDragSource, activateUlt, resetGame } =
    useGameState(zenMode);

  return (
    <main className="bg-background text-foreground relative min-h-screen p-3 md:p-8 xl:p-16">
      <div className="mx-auto flex max-w-150 flex-col items-center justify-start gap-4 md:gap-8 lg:max-w-200">
        <div className="flex w-full items-center justify-center">
          <h1 className="flex h-[1em] items-center gap-[0.4em] text-2xl font-bold tracking-tight sm:text-3xl md:text-5xl">
            <img src="/fox.svg" alt="Fox Spirit" className="h-full shrink-0" />
            <span className="hidden truncate sm:inline">
              Kitsune: Whisper of the Fox
            </span>
            <span className="sm:hidden">Kitsune</span>
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="absolute top-3 right-3"
              render={
                <Button variant={"ghost"} size={"icon-lg"}>
                  <Settings className="size-6" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
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
                    onCheckedChange={setDarkMode}
                    onClick={(e) => e.stopPropagation()}
                  />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Hud score={state.score} combo={state.combo} stars={state.stars} />

        {state.isTimeSlow && (
          <div className="text-primary animate-pulse text-xs font-semibold">
            🌙 Night Fox: Time Slow active (+15s added)
          </div>
        )}

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
          stars={state.stars}
          level={state.level}
          mode={zenMode ? "zen" : "normal"}
          onReset={resetGame}
        />
        <LeaderboardPanel
          open={showLeaderboard && state.phase !== "gameOver"}
          onClose={() => setShowLeaderboard(false)}
        />
      </div>
    </main>
  );
}
