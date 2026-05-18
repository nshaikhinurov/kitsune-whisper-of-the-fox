import path from "node:path";
import { defineConfig } from "vitest/config";

// Three suites with different runtimes:
// - engine: pure TS, no DOM/Convex runtime → fast Node env.
// - convex: convex-test mutation/query tests → edge-runtime (per Convex
//   guidelines; convex-test needs it).
// - client: drives the real React hook (jsdom + fake timers) to guard
//   client/server scoring parity against the engine's replay().
const alias = {
  "~": path.resolve(__dirname, "./src"),
  "@engine": path.resolve(__dirname, "./convex/engine"),
};

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
      {
        resolve: { alias },
        test: {
          name: "client",
          include: ["src/**/*.test.{ts,tsx}"],
          environment: "jsdom",
          setupFiles: ["./src/test/setup-client.ts"],
        },
      },
    ],
  },
});
