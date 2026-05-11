function play(src: string) {
  new Audio(src).play().catch(() => {});
}

export const Audition = {
  tileSwiped: () => play("/sounds/tile-swiped.mp3"),
  tilesNotMatched: () => play("/sounds/tiles-not-matched.mp3"),
  heartCollected: () => play("/sounds/heart-collected.mp3"),
  tilesMatched: () => play("/sounds/tiles-matched.mp3"),
  timerEnded: () => play("/sounds/timer-ended.mp3"),
  comboHappened: (combo: number) => {
    if (combo % 3 === 0) play("/sounds/combo.mp3");
  },
};
