import { AnimatePresence, motion } from "motion/react";
import { useGameState } from "./hooks/use-game-state";
import { Board } from "./components/board";
import { Hud } from "./components/hud";
import { SpiritPanel } from "./components/spirit-panel";

function App() {
  const { state, selectCell, activateUlt, resetGame } = useGameState();

  return (
    <div
      className={[
        "flex flex-col items-center justify-start min-h-screen gap-3 py-4 px-2 transition-colors duration-700",
        state.isDarkTheme
          ? "bg-slate-950 text-yellow-400"
          : "bg-slate-900 text-white",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h1 className="text-2xl font-bold tracking-tight">🦊 Fox Spirit Match</h1>

      <Hud
        score={state.score}
        combo={state.combo}
        movesLeft={state.movesLeft}
        gems={state.gems}
        level={state.level}
      />

      <SpiritPanel spiritCharge={state.spiritCharge} onActivate={activateUlt} />

      {state.isTimeSlow && (
        <div className="text-yellow-400 text-xs font-semibold animate-pulse">
          🌙 Night Fox: Time Slow active (+5 moves)
        </div>
      )}

      <Board
        board={state.board}
        selected={state.selected}
        onCellClick={selectCell}
      />

      <AnimatePresence>
        {state.phase === "gameOver" && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl text-white max-w-xs w-full mx-4"
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
            >
              <h2 className="text-3xl font-bold">Game Over</h2>
              <p className="text-slate-400">No moves remaining</p>
              <div className="text-center">
                <motion.p
                  className="text-4xl font-bold text-yellow-400"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                >
                  {state.score.toLocaleString()}
                </motion.p>
                <p className="text-slate-400 text-sm">Final Score</p>
              </div>
              <div className="flex gap-6 text-sm text-slate-300">
                <span>💎 {state.gems} gems</span>
                <span>Level {state.level}</span>
              </div>
              <button
                className="mt-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-lg transition-colors"
                onClick={resetGame}
              >
                Play Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
