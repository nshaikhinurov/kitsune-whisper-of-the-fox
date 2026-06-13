import { motion } from "motion/react";
import { GAME_DURATION_MS } from "~/shared/config/game-config";

interface TimerBarProps {
  timeLeft: number;
  started?: boolean;
}

export function TimerBar({ timeLeft, started = true }: TimerBarProps) {
  const timeLeftPercentage = Math.max(0, timeLeft / GAME_DURATION_MS);
  const secondsLeft = Math.ceil(timeLeft / 1000);

  const fullColor = "oklch(0.829 0.1712 81.04)";
  const zeroColor = "oklch(0.6005 0.1597 18.62)";
  const barColor = `color-mix(in oklch, ${fullColor} ${(timeLeftPercentage * 100).toFixed(1)}%, ${zeroColor})`;

  return (
    <div data-testid="timer-bar" className="flex w-full items-center gap-3">
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
        className="font-sushi w-10 shrink-0 text-right text-3xl font-bold tabular-nums"
        style={{ color: barColor }}
        animate={
          !started
            ? { opacity: [1, 0.4, 1] }
            : timeLeft <= 10000
              ? { scale: [1, 1.2, 1] }
              : {}
        }
        transition={!started ? { duration: 1, repeat: Infinity } : { duration: 0.3 }}
      >
        {secondsLeft}
      </motion.span>
    </div>
  );
}
