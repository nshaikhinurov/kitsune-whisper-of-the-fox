import { defineConfig } from "vitest/config";

// Two suites with different runtimes:
// - engine: pure TS, no DOM/Convex runtime → fast Node env.
// - convex: convex-test mutation/query tests → edge-runtime (per Convex
//   guidelines; convex-test needs it).
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "engine",
          include: ["convex/engine/__tests__/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "convex",
          include: ["convex/**/*.test.ts"],
          exclude: ["convex/engine/__tests__/**"],
          environment: "edge-runtime",
          server: { deps: { inline: ["convex-test"] } },
        },
      },
    ],
  },
});
