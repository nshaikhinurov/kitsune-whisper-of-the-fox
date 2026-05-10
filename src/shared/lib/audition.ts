function play(src: string) {
  new Audio(src).play().catch(() => {});
}

export const Audition = {
  tileSelect: () => play("/sounds/tile-select.mp3"),
  heartCollected: () => play("/sounds/heart-collected.mp3"),
  tilesMatched: () => play("/sounds/tiles-matched.mp3"),
};
