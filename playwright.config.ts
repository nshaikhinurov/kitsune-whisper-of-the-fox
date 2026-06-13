import { defineConfig, devices } from "@playwright/test";

const PORT = 5180;
const BASE_URL = `https://localhost:${PORT}`;

// Visual / responsive E2E suite. The app is served over HTTPS by
// vite-plugin-mkcert, so the browser context must ignore cert errors.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "html",
  // Pixel snapshots are platform-dependent; allow a little tolerance for
  // font/AA differences between machines.
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  use: {
    baseURL: BASE_URL,
    ignoreHTTPSErrors: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec vite --host --port ${PORT} --strictPort`,
    url: BASE_URL,
    ignoreHTTPSErrors: true,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
