import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useGameState } from "../features/game-session";
import { cn } from "../shared/lib/utils";
import { Switch } from "../shared/ui/switch";
import { Board } from "../widgets/game-board";
import { Hud, TimerBar } from "../widgets/game-hud";
import { GameOverBlock } from "../widgets/game-over";
import { HelpBlock } from "../widgets/help-block";
import { SpiritPanel } from "../widgets/spirit-panel";

export function MainPage() {
  const [showHints, setShowHints] = useState(true);
  const [zenMode, setZenMode] = useState(false);
  const { state, selectCell, activateUlt, resetGame } = useGameState(zenMode);

  return (
    <main
      className={cn(
        "flex flex-col items-center justify-start min-h-screen gap-10 p-16 transition-colors duration-700",
        state.isDarkTheme
          ? "bg-neutral-950 text-yellow-400"
          : "bg-neutral-900 text-white",
      )}
    >
      <h1 className="flex items-center gap-[0.4em] text-5xl h-[1em] font-bold tracking-tight">
        <img src="/fox.svg" alt="Fox Spirit" className="h-full" />
        Kitsune: Whisper of the Fox
      </h1>

      <Hud
        score={state.score}
        combo={state.combo}
        stars={state.stars}
        level={state.level}
      />

      <div className="w-full max-w-105 flex items-center justify-between">
        <HelpBlock />
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
            <Switch size="sm" checked={zenMode} onCheckedChange={setZenMode} />
            Zen mode
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-400 cursor-pointer select-none">
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
        <div className="text-yellow-400 text-xs font-semibold animate-pulse">
          🌙 Night Fox: Time Slow active (+15s added)
        </div>
      )}

      <div className="flex items-stretch gap-3">
        <SpiritPanel
          spiritCharge={state.spiritCharge}
          onActivate={activateUlt}
        />
        <Board
          board={state.board}
          selected={state.selected}
          hintPositions={showHints ? state.hintPositions : null}
          onCellClick={selectCell}
        />
        {!zenMode && <TimerBar timeLeft={state.timeLeft} />}
      </div>

      <AnimatePresence>
        {state.phase === "gameOver" && (
          <GameOverBlock
            score={state.score}
            stars={state.stars}
            level={state.level}
            onReset={resetGame}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
