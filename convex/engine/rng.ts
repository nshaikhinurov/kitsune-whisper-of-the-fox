// Deterministic PRNG (mulberry32). Pure and global-free so the client and the
// server consume an identical stream from the same seed — the foundation of
// server-authoritative replay validation.

export type Rng = () => number;

// 32-bit uint seed -> generator producing floats in [0, 1).
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function rng(): number {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}
