import { useState } from "react";
import {
  SHOW_HINTS_INITIALLY,
  ZEN_MODE_ON_INITIALLY,
} from "~/shared/config/game-config";
import { useGameState } from "../features/game-session";
import { cn } from "../shared/lib/utils";
import { Switch } from "../shared/ui/switch";
import { Board } from "../widgets/game-board";
import { Hud, TimerBar } from "../widgets/game-hud";
import { GameOverBlock } from "../widgets/game-over";
import { HelpBlock } from "../widgets/help-block";
import { LeaderboardPanel } from "../widgets/leaderboard";
import { SpiritPanel } from "../widgets/spirit-panel";

export function MainPage() {
  const [showHints, setShowHints] = useState(SHOW_HINTS_INITIALLY);
  const [zenMode, setZenMode] = useState(ZEN_MODE_ON_INITIALLY);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const { state, selectCell, activateUlt, resetGame } = useGameState(zenMode);

  return (
    <main
      className={cn(
        "min-h-screen p-4 md:p-8 xl:p-16",
        state.isDarkTheme
          ? "bg-neutral-950 text-yellow-400"
          : "bg-neutral-900 text-white",
      )}
    >
      <div className="mx-auto flex min-h-screen max-w-[min(90vw,600px)] flex-col items-center justify-start gap-4 md:gap-8 lg:max-w-[min(68vw,800px)] lg:gap-10">
        <h1 className="flex h-[1em] items-center gap-[0.4em] text-2xl font-bold tracking-tight sm:text-3xl md:text-5xl">
          <img src="/fox.svg" alt="Fox Spirit" className="h-full shrink-0" />
          <span className="hidden sm:inline">Kitsune: Whisper of the Fox</span>
          <span className="sm:hidden">Kitsune</span>
        </h1>

        <Hud score={state.score} combo={state.combo} stars={state.stars} />

        <div className="flex w-full max-w-[min(90vw,600px)] flex-wrap items-center justify-between gap-2 lg:max-w-[min(68vw,800px)]">
          <HelpBlock />
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-400 select-none">
              <Switch
                size="sm"
                checked={zenMode}
                onCheckedChange={setZenMode}
              />
              Zen mode
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-400 select-none">
              <Switch
                size="sm"
                checked={showHints}
                onCheckedChange={setShowHints}
              />
              Show hints
            </label>
          </div>
        </div>

        {state.isTimeSlow && (
          <div className="animate-pulse text-xs font-semibold text-yellow-400">
            🌙 Night Fox: Time Slow active (+15s added)
          </div>
        )}

        <div className="flex w-full flex-col items-center gap-3">
          <Board
            board={state.board}
            selected={state.selected}
            hintPositions={showHints ? state.hintPositions : null}
            onCellClick={selectCell}
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
