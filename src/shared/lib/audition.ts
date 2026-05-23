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

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const buffers = {} as Record<SoundKey, AudioBuffer | undefined>;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = 1;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

async function preload() {
  const context = getCtx();
  if (!context) return;
  await Promise.all(
    (Object.keys(sources) as SoundKey[]).map(async (key) => {
      try {
        const res = await fetch(sources[key]);
        const data = await res.arrayBuffer();
        buffers[key] = await context.decodeAudioData(data);
      } catch {
        // ignore — sound will be silently unavailable
      }
    }),
  );
}

if (typeof window !== "undefined") {
  void preload();
}

function play(key: SoundKey) {
  const context = getCtx();
  const buffer = buffers[key];
  if (!context || !masterGain || !buffer) return;
  if (context.state === "suspended") void context.resume();
  const src = context.createBufferSource();
  src.buffer = buffer;
  src.connect(masterGain);
  src.start(0);
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
