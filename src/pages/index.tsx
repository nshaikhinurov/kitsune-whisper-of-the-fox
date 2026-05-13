import { MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SHOW_HINTS_INITIALLY,
  ZEN_MODE_ON_INITIALLY,
} from "~/shared/config/game-config";
import { startThemeTransition } from "~/shared/lib/theme-transition";
import { Button } from "~/shared/ui/button";
import { TimerBar } from "~/widgets/timer-bar";
import { ChatPanel } from "../features/chat";
import { useDarkMode } from "../features/dark-mode/use-dark-mode";
import { useGameState } from "../features/game-session";
import { LeaderboardPanel } from "../features/leaderboard";
import { Board } from "../widgets/game-board";
import { Hud } from "../widgets/game-hud";
import { GameOverBlock } from "../widgets/game-over";
import { SettingsMenu } from "../widgets/settings-menu";
import { SpiritPanel } from "../widgets/spirit-panel";

export function MainPage() {
  const [showHints, setShowHints] = useState(SHOW_HINTS_INITIALLY);
  const [zenMode, setZenMode] = useState(ZEN_MODE_ON_INITIALLY);
  const [darkMode, setDarkMode] = useDarkMode();

  const [chatOpen, setChatOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "z" || e.key === "Z") setZenMode((v) => !v);
      if (e.key === "h" || e.key === "H") setShowHints((v) => !v);
      if (e.key === "l" || e.key === "L") setLeaderboardOpen((v) => !v);
      if (e.key === "d" || e.key === "D" || e.key === "в" || e.key === "В")
        setDarkMode((v) => !v);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setDarkMode]);

  const { state, swipeSwap, setDragSource, activateUlt, resetGame } =
    useGameState(zenMode, chatOpen);

  const zenModeInitialized = useRef(false);
  useEffect(() => {
    if (!zenModeInitialized.current) {
      zenModeInitialized.current = true;
      return;
    }
    resetGame();
  }, [zenMode]);

  const firstRun = useRef(true);
  useEffect(() => {
    const apply = () => {
      document.documentElement.classList.toggle("dark", darkMode);
    };
    if (firstRun.current) {
      firstRun.current = false;
      apply();
      return;
    }
    startThemeTransition(apply);
  }, [darkMode]);

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
      className="bg-background text-foreground relative min-h-screen bg-[radial-gradient(circle,var(--dot-color)_var(--dot-size),transparent_calc(var(--dot-size)+0.5px))] bg-size-[var(--dot-spacing)_var(--dot-spacing)] p-3 md:p-5 xl:p-8"
    >
      <div className="mx-auto flex max-w-150 flex-col items-center justify-start gap-4 md:gap-8 lg:max-w-200">
        <div className="flex w-full items-center justify-start sm:justify-center">
          <h1 className="flex h-[1em] items-center gap-[0.4em] text-2xl sm:text-3xl md:text-5xl">
            <img src="/imgs/ori-cat.svg" alt="Ori cat" className="h-full" />
            <img
              src="/imgs/logo.svg"
              alt="Purrrfect Match"
              className="h-full"
            />
          </h1>
          <Button
            variant="ghost"
            size="icon-lg"
            className="absolute top-3 right-14"
            onClick={() => setChatOpen(true)}
            aria-label="Открыть чат"
          >
            <MessageCircle className="size-6" />
          </Button>

          <SettingsMenu
            zenMode={zenMode}
            onZenModeChange={setZenMode}
            showHints={showHints}
            onShowHintsChange={setShowHints}
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
            onLeaderboardOpen={() => setLeaderboardOpen(true)}
          />
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

          {!zenMode && <TimerBar timeLeft={state.timeLeft} started={state.timerStarted} />}
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

      <ChatPanel open={chatOpen} onOpenChange={setChatOpen} />
      <LeaderboardPanel
        open={leaderboardOpen}
        mode={zenMode ? "zen" : "normal"}
        onClose={() => setLeaderboardOpen(false)}
      />
    </main>
  );
}
