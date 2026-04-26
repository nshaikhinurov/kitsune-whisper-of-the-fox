# Code Review — Kitsune: Whisper of the Fox

Reviewed: 2026-04-27. Scope: `src/`, `convex/`, `package.json`. The codebase is small, well-organised (FSD-style: `app / pages / widgets / features / entities / shared`), and broadly readable. Below are the issues worth acting on, ordered roughly by impact.

---

## 🔴 Bugs / correctness

### 1. Leaderboard cannot be opened from the main view
`src/pages/index.tsx:29` declares `showLeaderboard` state and `src/pages/index.tsx:148` renders `<LeaderboardPanel open={showLeaderboard && state.phase !== "gameOver"} />`, but `setShowLeaderboard` is **only ever called with `false`** in this file. There is no button, menu item, or trigger that opens the leaderboard outside Game Over. Either:
- wire a "Leaderboard" item into the settings dropdown (`src/pages/index.tsx:62`), or
- delete the state and the panel render here entirely (the only working entry point is the one inside `GameOverBlock`).

### 2. Leaderboard mutation has no score validation or rate limiting
`convex/leaderboard.ts:10` accepts arbitrary `score`, `stars`, `level` values from the client. A trivial DevTools call submits `Number.MAX_SAFE_INTEGER` and pollutes the public leaderboard forever. Minimum hardening:
- Cap `score`, `stars`, `level` to plausible upper bounds (`v.float64()` + handler-side `if (args.score > 1_000_000) throw …`).
- Add a per-IP / per-nickname rate limit (e.g. `@convex-dev/rate-limiter` component) — `npx convex ai-files install` will pull the helper skill.
- Consider deriving an HMAC or session token from a server-issued game id instead of trusting the client. For a hobby game this may be overkill; the cheap caps above are not.

### 3. Fisher–Yates shuffle in ultimates is biased
`src/features/game-session/model/use-game-state.ts:455-458` (Ori), `:477-480` (Green), and `:530-535` (Sakura) all use:
```ts
for (let i = 0; i < count; i++) {
  const j = Math.floor(Math.random() * positions.length); // ← full range
  [positions[i], positions[j]] = [positions[j], positions[i]];
}
```
Picking `j` from the full range (not `[i, length)`) re-swaps already-placed indices, so the result is non-uniform. The honest version:
```ts
const j = i + Math.floor(Math.random() * (positions.length - i));
```
`shuffleRegion` in `src/shared/lib/board.ts:143` does it correctly — copy that pattern.

### 4. `comboResetTimeoutRef` is not cleared on `resetGame`
`src/features/game-session/model/use-game-state.ts:595` resets cascade refs and state but ignores `comboResetTimeoutRef.current`. After a Play Again, a stale 2-second timeout from the previous game can fire and zero out the fresh combo. Add:
```ts
if (comboResetTimeoutRef.current) clearTimeout(comboResetTimeoutRef.current);
comboResetTimeoutRef.current = null;
```

### 5. `level` field is dead and is being submitted as `1` forever
`level: 1` is set in `makeInitialState` (`use-game-state.ts:171`) and never written again, but it's surfaced in the Game Over UI (`widgets/game-over.tsx:85`) and persisted on every leaderboard row (`convex/schema.ts:9`). Either implement levelling or drop the field from the schema, the type (`shared/types/game.ts:52`), and the submit payload. Right now it is just visual noise that pollutes the DB.

### 6. `isDarkTheme` is set by Night Fox but never consumed
`use-game-state.ts:513` sets `isDarkTheme = true`, but the only "dark mode" the UI renders is driven by the unrelated `darkMode` localStorage flag in `pages/index.tsx:30-37`. The Night Fox visual effect promised by the field doesn't exist. Either render it (e.g. a body class while `state.isDarkTheme`) or remove the field.

### 7. `BOARD_REFILL_REGEN_AT` constant is defined and unused
`shared/config/game-config.ts:39` exports `BOARD_REFILL_REGEN_AT = 25` with no references. If the intent was "after 25 refill attempts, regenerate the whole board," wire it into `refillBoard` (`shared/lib/board.ts:107`); otherwise delete it. Today, when `BOARD_REFILL_ATTEMPTS` is exhausted, `refillBoard` returns a possibly deadlocked board with no possible move — the game will silently stall.

---

## 🟡 Performance / correctness-adjacent

### 8. `new Audio(...)` per phase change
`use-game-state.ts:242` and `:249` construct a fresh `Audio` on every star pickup and every clearing transition. On rapid cascades this leaks short-lived audio elements and can race with the browser's autoplay policy. Hoist to module scope (or `useRef`) and call `audio.currentTime = 0; audio.play()`, the same pattern `widgets/game-board/ui/cell.tsx:7` already uses for `tileSelectSound`.

### 9. `hasPossibleMove` is O(rows·cols) full board copies × `findMatches`
`shared/lib/matches.ts:56-76` rebuilds a 6×6 array twice per cell to test each swap, then re-runs `findMatches` over the whole board. Inside `refillBoard` it can run up to 50 times in a single refill. For a 6×6 board it's not a real problem yet, but the cost will balloon if `GRID_*` ever grows. An early-exit check restricted to the 5 cells around each candidate swap is ~30× cheaper.

### 10. `refillBoard` re-rolls *only* `newPositions`
`shared/lib/board.ts:107-112` only re-rolls the freshly added tiles when no move exists. If the deadlock is structural (e.g. the existing tiles form a permanent blockade), this loop never converges and the loop exits with a board that has no possible move and no hint. See item 7 — the unused `BOARD_REFILL_REGEN_AT` constant looks like the intended fallback.

---

## 🟢 Code quality / hygiene

### 11. `shadcn` is in runtime `dependencies`
`package.json:26`. `shadcn` is a CLI scaffolder, not a runtime library — move it to `devDependencies` to avoid shipping it into the client bundle resolution graph.

### 12. `lucide-react: ^1.8.0` is suspicious
`package.json:22`. Current lucide-react is on a much higher major. Worth verifying this is actually the package you expect (and not pulled from a stale lockfile) — the icons you import (`Moon`, `Settings`, `Sun`) compile, but you may be missing years of fixes.

### 13. Two-key state sync in `MainPage` dark-mode effect
`pages/index.tsx:34-37` writes both the DOM class and localStorage in one effect. Fine, but the initial-state reader (`localStorage.getItem(...) !== "false"`) defaults *missing* keys to `true` (i.e. dark on by default for new users). Probably intentional; worth a one-line comment because it's not obvious from the read.

### 14. Score-flash centroid arithmetic is duplicated
The pattern `[...matchedSet].map(k => k.split(",").map(Number))` plus a centroid reduce appears once today (`use-game-state.ts:122-133`) but the cluster of `${r},${c}` ↔ `[r,c]` round-trips throughout `matches.ts` and `use-game-state.ts` is begging for a tiny `Position` codec helper. Not urgent, but it's the highest-density source of off-by-one risk.

### 15. Commented-out debug label still in `fox-tile.tsx`
`widgets/game-board/ui/fox-tile.tsx:18-21` carries a TODO with dead JSX. Either keep it behind a `import.meta.env.DEV` flag or delete it.

### 16. `GameOverBlock` and `MainPage` both render `LeaderboardPanel`
`widgets/game-over.tsx:41` and `pages/index.tsx:147` each instantiate the panel with their own `open` state. They are mutually exclusive (one is gated on `phase === "gameOver"`, the other on `phase !== "gameOver"`), but the duplication is fragile — if you ever forget to gate one of them they'll both mount, double-fetching `getTopScores`. Consider lifting the panel + open-state to `MainPage` and passing a single `onOpen` down to `GameOverBlock`.

### 17. `Cell` constructs a module-singleton `Audio` shared across tiles
`widgets/game-board/ui/cell.tsx:7`. Works, but rapid drags from two fingers will cut each other off because `currentTime = 0` on a single element. A small pool (3-4 buffers, round-robin) sounds noticeably better for chain-swipes; low priority.

### 18. `tileId` counter is module-global and survives `resetGame`
`shared/lib/board.ts:11`. Not a bug — IDs only need to be unique within a session — but worth noting that across HMR or fast-refresh boundaries the counter persists, which can cause Framer Motion `layoutId` collisions during dev. Consider keying it off `crypto.randomUUID()` or resetting it inside `createBoard` when `_tileIdCounter` exceeds some threshold.

---

## ✅ What's working well

- Phase-driven cascade FSM (`swapping → clearing → falling → idle`) is clean and the side-effect timing (`SWAP_ANIM_MS`, `CLEAR_ANIM_MS`, `FALL_ANIM_MS`) is centralised in config.
- `computeCascadeSteps` precomputes the entire chain up-front, so the render loop only animates state — no logic drift between gameplay and animation.
- `stateRef` + `zenModeRef` pattern correctly avoids stale-closure bugs in the long-lived `setInterval`.
- `convex/schema.ts` indexes by score, so `getTopScores` is a cheap range read.
- `useTileSwipe` is a tidy abstraction that keeps `Cell` markup-focused.

---

## Suggested fix order

1. Items **1, 4, 5, 6, 7** — small, mechanical, remove dead code or clearly-broken behaviour.
2. Item **2** — leaderboard validation; ship before sharing the URL.
3. Item **3** — biased shuffle; one-line fix, repeated three times.
4. Item **8** — audio hoisting; tiny, prevents leaks on long sessions.
5. Items **9, 10** — only worth doing if you grow the grid or see deadlocks in practice.
6. Items **11–18** — opportunistic cleanup.
