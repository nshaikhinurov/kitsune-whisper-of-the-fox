import { AnimatePresence } from "motion/react";
import { useGameState } from "../features/game-session";
import { cn } from "../shared/lib/utils";
import { Board } from "../widgets/game-board";
import { Hud, TimerBar } from "../widgets/game-hud";
import { GameOverBlock } from "../widgets/game-over";
import { HelpBlock } from "../widgets/help-block";
import { SpiritPanel } from "../widgets/spirit-panel";

export function MainPage() {
  const { state, selectCell, activateUlt, resetGame } = useGameState();

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
        gems={state.gems}
        level={state.level}
      />

      <SpiritPanel spiritCharge={state.spiritCharge} onActivate={activateUlt} />

      <HelpBlock />

      {state.isTimeSlow && (
        <div className="text-yellow-400 text-xs font-semibold animate-pulse">
          🌙 Night Fox: Time Slow active (+15s added)
        </div>
      )}

      <div className="flex items-stretch gap-3">
        <Board
          board={state.board}
          selected={state.selected}
          onCellClick={selectCell}
        />
        <TimerBar timeLeft={state.timeLeft} />
      </div>

      <AnimatePresence>
        {state.phase === "gameOver" && (
          <GameOverBlock
            score={state.score}
            gems={state.gems}
            level={state.level}
            onReset={resetGame}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
