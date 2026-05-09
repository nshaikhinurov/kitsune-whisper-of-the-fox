function play(src: string) {
  new Audio(src).play().catch(() => {});
}

export const Audition = {
  tileSelect: () => play("/tile-select.mp3"),
  heartCollected: () => play("/heart-collected.mp3"),
  tilesMatched: () => play("/tiles-matched.mp3"),
};
