import { motion } from "motion/react";
import { GAME_DURATION_MS } from "~/shared/config/game-config";

interface TimerBarProps {
  timeLeft: number;
}

export function TimerBar({ timeLeft }: TimerBarProps) {
  const timeLeftPercentage = Math.max(0, timeLeft / GAME_DURATION_MS);
  const secondsLeft = Math.ceil(timeLeft / 1000);

  // oklch: lime at 100% → red at 0%
  const hue = 30 + 110 * timeLeftPercentage;
  const lightness = 0.65;
  const chroma = 0.26;
  const barColor = `oklch(${lightness.toFixed(3)} ${chroma} ${hue.toFixed(1)})`;

  return (
    <div className="flex w-full items-center gap-3">
      <div className="bg-muted h-5 flex-1 overflow-hidden rounded-full">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: barColor }}
          animate={{ width: `${timeLeftPercentage * 100}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>
      <motion.span
        key={secondsLeft}
        className="w-10 shrink-0 text-right text-3xl font-bold tabular-nums"
        style={{ color: barColor }}
        animate={timeLeft <= 10000 ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {secondsLeft}
      </motion.span>
    </div>
  );
}
