import { randomSeed } from "@engine/rng";
import { useMutation } from "convex/react";
import { MessageCircle, Trophy } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  SHOW_HINTS_INITIALLY,
  ZEN_MODE_ON_INITIALLY,
} from "~/shared/config/game-config";
import { startThemeTransition } from "~/shared/lib/theme-transition";
import type { GameMode } from "~/shared/types/leaderboard";
import { Button } from "~/shared/ui/button";
import { TimerBar } from "~/widgets/timer-bar";
import { api } from "../../convex/_generated/api";
import { ChatPanel } from "../features/chat";
import {
  useDarkMode,
  useThemeTransitionActive,
} from "../features/dark-mode/use-dark-mode";
import { useGameState } from "../features/game-session";
import { LeaderboardPanel } from "../features/leaderboard";
import { Board } from "../widgets/game-board";
import { Hud } from "../widgets/game-hud";
import { GameOverBlock } from "../widgets/game-over";
import { SettingsMenu } from "../widgets/settings-menu";
import { SpiritPanel } from "../widgets/spirit-panel";
import { StartMenu } from "../widgets/start-menu";

export function MainPage() {
  const [showHints, setShowHints] = useState(SHOW_HINTS_INITIALLY);
  const [zenMode, setZenMode] = useState(ZEN_MODE_ON_INITIALLY);
  const [gameStarted, setGameStarted] = useState(false);
  const [darkMode, setDarkMode] = useDarkMode();
  // A theme switch runs a 1.5s view transition that visually freezes the
  // screen (timer included). Treat it as a pause so the countdown and the
  // server-replay clock freeze together and board input is blocked — otherwise
  // the player could keep matching/scoring during the frozen window.
  const themeTransitioning = useThemeTransitionActive();

  const [chatOpen, setChatOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const startGame = useMutation(api.sessions.startGame);
  const [session, setSession] = useState<{
    gameId: string | null;
    seed: number;
  }>(() => ({ gameId: null, seed: randomSeed() }));

  // A new game asks the server for a seed. If the request fails the game still
  // plays with a local seed (such a run will be flagged at submit in Phase 2).
  const newSession = useCallback(
    async (mode: GameMode) => {
      try {
        const res = await startGame({ mode });
        setSession({ gameId: res.gameId, seed: res.seed });
      } catch {
        setSession({ gameId: null, seed: randomSeed() });
      }
    },
    [startGame],
  );

  // The session starts only once the player picks a mode in the start menu.
  const startedRef = useRef(false);
  const handleStartGame = useCallback(
    (mode: GameMode) => {
      setZenMode(mode === "zen");
      setGameStarted(true);
      startedRef.current = true;
      void newSession(mode);
    },
    [newSession],
  );

  // Toggling the mode mid-game restarts the session in the new mode.
  const handleZenModeChange = useCallback(
    (next: boolean) => {
      setZenMode(next);
      if (startedRef.current) void newSession(next ? "zen" : "normal");
    },
    [newSession],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "z" || e.key === "Z") handleZenModeChange(!zenMode);
      if (e.key === "h" || e.key === "H") setShowHints((v) => !v);
      if (e.key === "l" || e.key === "L") setLeaderboardOpen((v) => !v);
      if (e.key === "d" || e.key === "D" || e.key === "в" || e.key === "В")
        setDarkMode((v) => !v);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zenMode, handleZenModeChange, setDarkMode]);

  const { state, swipeSwap, setDragSource, activateUlt, gameId, getActionLog } =
    useGameState(
      zenMode,
      chatOpen ||
        leaderboardOpen ||
        settingsOpen ||
        !gameStarted ||
        themeTransitioning,
      session.seed,
      session.gameId,
    );

  const handleNewGame = useCallback(
    () => void newSession(zenMode ? "zen" : "normal"),
    [newSession, zenMode],
  );

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
      className="bg-background text-foreground relative flex h-screen flex-col overflow-hidden bg-[radial-gradient(circle,var(--dot-color)_var(--dot-size),transparent_calc(var(--dot-size)+0.5px))] bg-size-[var(--dot-spacing)_var(--dot-spacing)] p-3 md:p-5 xl:p-8"
    >
      <div className="mx-auto flex h-full max-h-full w-full min-h-0 flex-col items-center justify-start gap-4 md:gap-6">
        <div className="flex w-full items-center justify-between">
          <h1 className="flex h-[1em] items-center gap-[0.4em] text-2xl sm:text-3xl md:text-5xl">
            <img src="/imgs/logo-cat.svg" alt="Ori cat" className="h-full" />
            <img
              src="/imgs/logo.svg"
              alt="Purrrfect Match"
              className="h-full"
            />
          </h1>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="icon-lg"
              onClick={() => setLeaderboardOpen(true)}
              aria-label="Таблица лидеров"
            >
              <Trophy className="size-6" />
            </Button>

            <Button
              variant="default"
              size="icon-lg"
              onClick={() => setChatOpen(true)}
              aria-label="Открыть чат"
            >
              <MessageCircle className="size-6" />
            </Button>

            <SettingsMenu
              zenMode={zenMode}
              onZenModeChange={handleZenModeChange}
              showHints={showHints}
              onShowHintsChange={setShowHints}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
              onOpenChange={setSettingsOpen}
            />
          </div>
        </div>

        <Hud score={state.score} combo={state.combo} hearts={state.hearts} />

        {session.gameId && (
          <div className="flex w-full min-h-0 flex-1 flex-col items-center gap-3">
            <div className="flex min-h-0 w-full flex-1 items-center justify-center [container-type:size]">
              <div
                data-testid="board"
                className="aspect-square w-[min(100cqw,100cqh)]"
              >
                <Board
                  board={state.board}
                  dragSource={state.dragSource}
                  hintPositions={showHints ? state.hintPositions : null}
                  scoreFlash={state.scoreFlash}
                  onSwipe={swipeSwap}
                  onDragSource={setDragSource}
                />
              </div>
            </div>

            <SpiritPanel
              spiritCharge={state.spiritCharge}
              onActivate={activateUlt}
            />

            {!zenMode && (
              <TimerBar
                timeLeft={state.timeLeft}
                started={state.timerStarted}
              />
            )}
          </div>
        )}

        <GameOverBlock
          open={state.phase === "gameOver"}
          score={state.score}
          hearts={state.hearts}
          mode={zenMode ? "zen" : "normal"}
          gameId={gameId}
          getActionLog={getActionLog}
          reason={state.gameOverReason}
          onReset={handleNewGame}
        />
      </div>

      <StartMenu open={!gameStarted} onStart={handleStartGame} />

      <ChatPanel open={chatOpen} onOpenChange={setChatOpen} />
      <LeaderboardPanel
        open={leaderboardOpen}
        mode={zenMode ? "zen" : "normal"}
        onClose={() => setLeaderboardOpen(false)}
      />
    </main>
  );
}
