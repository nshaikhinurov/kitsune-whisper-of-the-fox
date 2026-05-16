const sources = {
  tileSwiped: "/sounds/tile-swiped.mp3",
  tilesNotMatched: "/sounds/tiles-not-matched.mp3",
  heartCollected: "/sounds/heart-collected.mp3",
  tilesMatched: "/sounds/tiles-matched.mp3",
  timerEnded: "/sounds/timer-ended.mp3",
  combo: "/sounds/combo.mp3",
  electricUlt: "/sounds/tydysh.mp3",
} as const;

type SoundKey = keyof typeof sources;

const cache = {} as Record<SoundKey, HTMLAudioElement>;

for (const key in sources) {
  const audio = new Audio(sources[key as SoundKey]);
  audio.preload = "auto";
  audio.load();
  cache[key as SoundKey] = audio;
}

function play(key: SoundKey) {
  const node = cache[key].cloneNode(true) as HTMLAudioElement;
  node.play().catch(() => {});
}

export const Audition = {
  tileSwiped: () => play("tileSwiped"),
  tilesNotMatched: () => play("tilesNotMatched"),
  heartCollected: () => play("heartCollected"),
  tilesMatched: () => play("tilesMatched"),
  timerEnded: () => play("timerEnded"),
  comboHappened: (combo: number) => {
    if (combo % 3 === 0) play("combo");
  },
  electricUlt: () => play("electricUlt"),
};
