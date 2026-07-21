import { ConvexHttpClient } from "convex/browser";
import { expect, test, type Page } from "@playwright/test";
import { api } from "../convex/_generated/api";

// Node doesn't auto-load `.env.local` the way Vite does for its own dev
// server; load it here too so `fetchTopNormalScore` below can reach the same
// Convex deployment the app talks to.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Missing in CI or already provided via real env vars — fine either way.
}

// Popular resolutions across phones / tablets / laptops / desktops. 1366×768
// and 1280×720 are the tightest laptop sizes where cramped layouts tend to
// clip or push text out of its box first.
const VIEWPORTS = [
  { name: "mobile-360x800", width: 360, height: 800 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "laptop-1280x720", width: 1280, height: 720 },
  { name: "laptop-1366x768", width: 1366, height: 768 },
  { name: "laptop-1440x900", width: 1440, height: 900 },
  { name: "desktop-1920x1080", width: 1920, height: 1080 },
];

interface OverflowIssue {
  selector: string;
  text: string;
  kind: "own-box" | "clipped-by-ancestor";
  detail: string;
}

// Two independent ways text visually "sticks out of frame", both checked for
// every element that directly owns a non-empty text node:
//
//  1. `own-box` — the text is wider/taller than its own laid-out box, and
//     that box neither wraps, scrolls, nor clips it (`overflow: visible`,
//     the default) — it spills over onto whatever sits next to it.
//
//  2. `clipped-by-ancestor` — the element's own box is fine, but it pokes
//     past a `overflow: hidden` ancestor further up the tree. This one is
//     invisible rather than a visible spill (no scrollbar, no spill — the
//     browser just stops painting at the ancestor's edge), which is easy to
//     miss: a page-level `overflow-x: hidden` (common, used here on
//     `<body>` to suppress accidental horizontal scrollbars) silently
//     swallows the tail of any text that escapes it. This is exactly how a
//     flex child with `white-space: nowrap` sizes to its full unwrapped
//     content width, escapes its card, and gets its last few words clipped
//     with no visible sign anything is wrong.
//
// Elements that opt into `overflow: hidden/auto/scroll` on purpose
// (Tailwind `truncate`, `overflow-y-auto` lists, …) are exempt from #1 by
// definition. For #2, an `auto`/`scroll` ancestor is also exempt — that
// content is reachable by scrolling, not lost — only a `hidden`/`clip`
// ancestor counts.
async function findOverflowIssues(page: Page): Promise<OverflowIssue[]> {
  return page.evaluate(() => {
    // A few px of slack: some custom web fonts (e.g. the Geist Variable
    // headings) report a `scrollHeight` a couple px taller than
    // `clientHeight` purely from internal line-box metrics, with nothing
    // actually clipped in the painted box. Real overflow bugs run to tens or
    // hundreds of px, well clear of this margin.
    const TOLERANCE = 4;
    const issues: OverflowIssue[] = [];

    function describe(el: Element): string {
      const testId = (el as HTMLElement).dataset?.testid;
      return `${el.tagName.toLowerCase()}${testId ? `[data-testid="${testId}"]` : ""}`;
    }

    function nearestOverflowAncestorX(
      el: Element,
    ): { node: Element; clips: boolean } | null {
      let node = el.parentElement;
      while (node) {
        const overflowX = getComputedStyle(node).overflowX;
        if (overflowX === "hidden" || overflowX === "clip") {
          return { node, clips: true };
        }
        if (overflowX === "auto" || overflowX === "scroll") {
          return { node, clips: false };
        }
        node = node.parentElement;
      }
      return null;
    }

    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? "")
        .join("")
        .trim();
      if (!ownText) continue;

      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      const ownOverflowsX =
        el.scrollWidth > el.clientWidth + TOLERANCE &&
        style.overflowX === "visible";
      const ownOverflowsY =
        el.scrollHeight > el.clientHeight + TOLERANCE &&
        style.overflowY === "visible";
      if (ownOverflowsX || ownOverflowsY) {
        issues.push({
          selector: describe(el),
          text: ownText.slice(0, 60),
          kind: "own-box",
          detail: `scroll ${el.scrollWidth}x${el.scrollHeight} > client ${el.clientWidth}x${el.clientHeight}`,
        });
        continue;
      }

      // Fixed/absolute/sticky elements (tooltips, portalled dialogs,
      // animated overlays) intentionally escape their DOM parent's box —
      // only elements in normal flow are compared to an ancestor.
      const inFlow =
        style.position === "static" || style.position === "relative";
      if (!inFlow) continue;

      const ancestor = nearestOverflowAncestorX(el);
      if (!ancestor || !ancestor.clips) continue;
      const ancRect = ancestor.node.getBoundingClientRect();
      if (
        rect.right > ancRect.right + TOLERANCE ||
        rect.left < ancRect.left - TOLERANCE
      ) {
        issues.push({
          selector: describe(el),
          text: ownText.slice(0, 60),
          kind: "clipped-by-ancestor",
          detail: `rect ${Math.round(rect.left)}–${Math.round(rect.right)} outside ${describe(ancestor.node)} ${Math.round(ancRect.left)}–${Math.round(ancRect.right)}`,
        });
      }
    }
    return issues;
  });
}

// Classic symptom of text overflow: it pushes the whole page wider than the
// viewport instead of wrapping, forcing an (undesired) horizontal scrollbar.
// Note this alone can't catch everything: if an ancestor (here, `<body>`)
// already sets `overflow-x: hidden`, the browser clips instead of growing
// `scrollWidth` — no scrollbar ever appears even though text is being cut
// off. `findOverflowIssues`'s `clipped-by-ancestor` case covers that gap.
async function hasHorizontalPageOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
}

function formatIssues(issues: OverflowIssue[]): string {
  return issues
    .map((i) => `[${i.kind}] ${i.selector} "${i.text}" — ${i.detail}`)
    .join("\n");
}

async function assertNoTextOverflow(page: Page) {
  expect(await hasHorizontalPageOverflow(page)).toBe(false);
  const issues = await findOverflowIssues(page);
  expect(issues, formatIssues(issues)).toEqual([]);
}

async function openStartMenu(page: Page) {
  await page.goto("/");
  await page.getByRole("heading", { name: "Выбери режим" }).waitFor();
}

async function startGame(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /Стандартный/ }).click();
  await page.getByTestId("board").waitFor();
  // Let the start-menu dialog finish closing and the entry animations settle.
  await page.waitForTimeout(600);
}

async function openSettingsMenu(page: Page) {
  await startGame(page);
  await page.locator('[data-slot="dropdown-menu-trigger"]').click();
  await page.getByText("Настройки").waitFor();
  await page.waitForTimeout(200);
}

async function openLeaderboard(page: Page) {
  await startGame(page);
  await page.getByRole("button", { name: "Таблица лидеров" }).click();
  await page.getByRole("heading", { name: "Таблица лидеров" }).waitFor();
  // Let the leaderboard query resolve and rows finish their entry animation.
  await page.waitForTimeout(500);
}

async function openChat(page: Page) {
  await startGame(page);
  await page.getByRole("button", { name: "Открыть чат" }).click();
  await page.getByText("Живой коточат").waitFor();
  await page.waitForTimeout(300);
}

// The real countdown is anchored to wall-clock time (60s, unmockable via
// Playwright's clock — verified: it advances `performance.now()` fine, but
// the in-game timer only *starts* on a swipe that actually produces a match,
// which a scripted drag on a freshly-seeded board can't guarantee). Rather
// than fighting that, `MainPage` has a dev-only escape hatch
// (`?e2eGameOver=1&score=…&hearts=…&reason=…`, dead code in production
// builds — see `readGameOverOverride` in `src/pages/index.tsx`) that renders
// the real `GameOverBlock` with injected numbers. We feed it the actual #1
// normal-mode leaderboard score, so the dialog is stress-tested with a
// genuine, realistically-large (many-digit) score instead of a made-up one.
let topNormal = { score: 128450, hearts: 7 };
try {
  const url = process.env.VITE_CONVEX_URL;
  if (url) {
    const client = new ConvexHttpClient(url);
    const top = await client.query(api.leaderboard.getTopScores, {
      mode: "normal",
    });
    if (top[0]) topNormal = { score: top[0].score, hearts: top[0].hearts };
  }
} catch {
  // Fall back to the placeholder above if the backend is unreachable.
}

async function openGameOver(page: Page, reason: "time" | "deadlock") {
  const { score, hearts } = topNormal;
  await page.goto(
    `/?e2eGameOver=1&score=${score}&hearts=${hearts}&reason=${reason}`,
  );
  await page
    .getByRole("heading", {
      name: reason === "deadlock" ? "Ходы закончились!" : "Время вышло!",
    })
    .waitFor();
  await page.waitForTimeout(300);
}

const SCREENS: { name: string; open: (page: Page) => Promise<void> }[] = [
  { name: "start-menu", open: openStartMenu },
  { name: "in-game", open: startGame },
  { name: "settings-menu", open: openSettingsMenu },
  { name: "leaderboard", open: openLeaderboard },
  { name: "chat", open: openChat },
  { name: "game-over-time", open: (page) => openGameOver(page, "time") },
  {
    name: "game-over-deadlock",
    open: (page) => openGameOver(page, "deadlock"),
  },
];

for (const vp of VIEWPORTS) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const screen of SCREENS) {
      test(`${screen.name}: no text overflows its box`, async ({ page }) => {
        await screen.open(page);
        await assertNoTextOverflow(page);
      });
    }
  });
}
