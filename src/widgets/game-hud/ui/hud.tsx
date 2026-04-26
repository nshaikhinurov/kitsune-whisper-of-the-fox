import { motion } from "motion/react";

interface HudProps {
  score: number;
  combo: number;
  stars: number;
}

export function Hud({ score, stars }: HudProps) {
  return (
    <div className="flex w-full max-w-[min(90vw,420px)] items-center justify-between gap-2 rounded-xl bg-neutral-800/70 p-5 px-7 text-2xl font-bold text-white backdrop-blur sm:gap-4">
      <motion.div
        key={score}
        className="tabular-nums"
        initial={{ scale: 1.3, color: "#facc15" }}
        animate={{ scale: 1, color: "#ffffff" }}
        transition={{ duration: 0.3 }}
      >
        {score.toLocaleString()}
      </motion.div>

      <div className="flex flex-col items-center">
        <motion.div
          key={stars}
          className="align-baseline tabular-nums"
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <img
            src="/star.svg"
            alt="star"
            className="mr-1 inline h-4 w-4 align-baseline"
          />
          {stars}
        </motion.div>
      </div>
    </div>
  );
}
