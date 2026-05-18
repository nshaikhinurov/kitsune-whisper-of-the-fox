import { describe, expect, it } from "vitest";
import { createRng } from "../rng";

describe("mulberry32 rng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 50 }, () => a());
    const seqB = Array.from({ length: 50 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it("produces values in [0, 1)", () => {
    const r = createRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("diverges for different seeds", () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("matches an independent mulberry32 reference (algorithm drift guard)", () => {
    // Independent transcription of mulberry32. If createRng ever deviates from
    // this canonical algorithm, every client/server replay contract breaks —
    // this catches that without relying on precomputed magic constants.
    function refMulberry32(seed: number) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    for (const seed of [0, 1, 42, 999, 0xdeadbeef]) {
      const r = createRng(seed);
      const ref = refMulberry32(seed);
      const got = Array.from({ length: 100 }, () => r());
      const exp = Array.from({ length: 100 }, () => ref());
      expect(got).toEqual(exp);
    }
  });
});
