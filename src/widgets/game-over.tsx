import { motion } from "motion/react";

interface GameOverBlockProps {
  score: number;
  stars: number;
  level: number;
  onReset: () => void;
}

export const GameOverBlock = ({
  score,
  stars,
  level,
  onReset,
}: GameOverBlockProps) => {
  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-neutral-800 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl text-white max-w-xs w-full mx-4"
        initial={{ scale: 0.7, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
      >
        <h2 className="text-3xl font-bold">Game Over</h2>
        <p className="text-neutral-400">Time's up!</p>
        <div className="text-center">
          <motion.p
            className="text-4xl font-bold text-yellow-400"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          >
            {score.toLocaleString()}
          </motion.p>
          <p className="text-neutral-400 text-sm">Final Score</p>
        </div>
        <div className="flex gap-6 text-sm text-neutral-300">
          <span><img src="/star.svg" alt="star" className="inline w-4 h-4 mr-1 align-middle" />{stars} stars</span>
          <span>Level {level}</span>
        </div>
        <button
          className="mt-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-neutral-900 font-bold rounded-lg transition-colors"
          onClick={onReset}
        >
          Play Again
        </button>
      </motion.div>
    </motion.div>
  );
};
