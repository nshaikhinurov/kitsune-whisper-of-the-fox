import { motion } from "motion/react";
import { CoinIcon } from "../../../shared/ui/coin-icon";
import { StarIcon } from "../../../shared/ui/star-icon";

interface HudProps {
  score: number;
  combo: number;
  stars: number;
}

export function Hud({ score, combo, stars }: HudProps) {
  return (
    <div className="text-card-foreground bg-muted flex w-full items-center justify-between gap-2 rounded-xl p-3 px-5 text-4xl font-bold backdrop-blur sm:gap-4">
      <motion.div
        key={score}
        className="flex items-center gap-2.5 tabular-nums"
        initial={{ scale: 1.3, color: "#facc15" }}
        animate={{ scale: 1, color: "var(--card-foreground)" }}
        transition={{ duration: 0.3 }}
      >
        <CoinIcon className="size-8" />
        {score.toLocaleString()}
      </motion.div>

      {combo > 1 && (
        <motion.div
          key={combo}
          className="text-3xl tabular-nums"
          initial={{ scale: 1.3, color: "#facc15" }}
          animate={{ scale: 1, color: "var(--card-foreground)" }}
          transition={{ duration: 0.3 }}
        >
          combo x{combo}
        </motion.div>
      )}

      <div className="flex flex-col items-center">
        <motion.div
          key={stars}
          className="flex items-center gap-2.5 tabular-nums"
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <StarIcon className="size-8" />
          {stars}
        </motion.div>
      </div>
    </div>
  );
}
