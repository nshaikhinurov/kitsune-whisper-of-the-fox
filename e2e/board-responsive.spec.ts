import { expect, test, type Page } from "@playwright/test";

// Viewports that previously broke: 1366×768 is the laptop size where the
// board used to overflow and hide the spirit panel / timer below the fold.
const VIEWPORTS = [
  { name: "laptop-1366x768", width: 1366, height: 768 },
  { name: "laptop-1280x720", width: 1280, height: 720 },
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
  { name: "tablet-portrait-800x1280", width: 800, height: 1280 },
  { name: "mobile-375x667", width: 375, height: 667 },
];

async function startGame(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Стандартный/ }).click();
  await page.getByTestId("board").waitFor();
  // Let the start-menu dialog finish closing and the entry animations settle.
  await page.waitForTimeout(600);
}

function bottom(box: { y: number; height: number }) {
  return box.y + box.height;
}

for (const vp of VIEWPORTS) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("board stays square", async ({ page }) => {
      await startGame(page);
      const box = await page.getByTestId("board").boundingBox();
      expect(box).not.toBeNull();
      // Within 1px of a perfect square.
      expect(Math.abs(box!.width - box!.height)).toBeLessThanOrEqual(1);
    });

    test("board is limited by the smaller viewport dimension", async ({
      page,
    }) => {
      await startGame(page);
      const box = (await page.getByTestId("board").boundingBox())!;
      // The square can never exceed either available dimension.
      expect(box.width).toBeLessThanOrEqual(vp.width + 1);
      expect(box.height).toBeLessThanOrEqual(vp.height + 1);
      // And it should actually grow — not collapse to a tiny square.
      expect(box.width).toBeGreaterThan(Math.min(vp.width, vp.height) * 0.4);
    });

    test("nothing overflows the viewport (bottom stays visible)", async ({
      page,
    }) => {
      await startGame(page);
      const spirit = (await page.getByTestId("spirit-panel").boundingBox())!;
      const timer = (await page.getByTestId("timer-bar").boundingBox())!;
      expect(bottom(spirit)).toBeLessThanOrEqual(vp.height + 1);
      expect(bottom(timer)).toBeLessThanOrEqual(vp.height + 1);
      // The page itself must not scroll (body is fixed / overflow hidden).
      const scrolls = await page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight + 1,
      );
      expect(scrolls).toBe(false);
    });

    test("layout snapshot", async ({ page }) => {
      await startGame(page);
      // The spirit glow is a JS (rAF) box-shadow animation that bleeds past the
      // masked element and can't be frozen via `animations: "disabled"` — kill
      // it so the snapshot is fully deterministic.
      await page.addStyleTag({
        content: '[data-testid="spirit-panel"] button { box-shadow: none !important; }',
      });
      // Mask the regions with random/animated content (board tiles, live
      // counters, spirit charges, counting-down timer) so the snapshot
      // captures only the responsive layout geometry, not volatile pixels.
      await expect(page).toHaveScreenshot(`${vp.name}.png`, {
        animations: "disabled",
        mask: [
          page.getByTestId("board"),
          page.getByTestId("hud"),
          page.getByTestId("spirit-panel"),
          page.getByTestId("timer-bar"),
        ],
      });
    });
  });
}
