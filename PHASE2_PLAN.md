# Phase 2 — Server-authoritative replay validation

This is the part that actually closes the cheating hole. Phase 1 (shipped &
green) put a shared deterministic engine, server-issued seeds, `gameSessions`,
and a client action log in place. Phase 2 makes the **server** recompute the
score from the seed + action log and stops trusting any client-sent score.

Decisions carried from the approved plan:

- **Combo = option B**: keep the real-time 2s reset; the server reproduces the
  animation-timeline model and validates `t` spacing with a jitter tolerance.
- **Invalid replay = shadow flag**: invalid runs are still inserted but
  `flagged: true` and hidden from the public leaderboard (no hard reject for
  honest-but-divergent runs). Malformed input / unknown gameId / bad nickname
  still throw (protocol errors, not gameplay).
- Score is always the **server-replayed** value; the client-sent number is
  never stored.

## Work items

### 1. Schema — `convex/schema.ts`
- `leaderboard`: add `flagged: v.optional(v.boolean())` (absent = not flagged;
  legacy rows stay visible — accepted).
- (Optional) add an index to serve a flagged-excluding top query efficiently;
  otherwise over-fetch and filter in the query.

### 2. `submitRun` mutation — `convex/sessions.ts`
Args:
```
{
  gameId: v.id("gameSessions"),
  nickname: v.string(),
  actions: v.array(v.object({
    t: v.number(),
    type: v.union(v.literal("swap"), v.literal("ult")),
    from: v.optional(v.object({ row: v.number(), col: v.number() })),
    to:   v.optional(v.object({ row: v.number(), col: v.number() })),
    element: v.optional(v.union(
      v.literal("ori"), v.literal("green"), v.literal("electric"),
      v.literal("chaotic"), v.literal("night"), v.literal("sakura"))),
  })),
}
```
Handler:
1. Validate nickname (`trim`, 1–24) — throw on failure (protocol).
2. `ctx.db.get(gameId)`; missing → throw. Already `submitted` → insert
   `flagged: true` with replayed score and return (one-shot anti-replay).
3. Flip session `status: "submitted"` (even when the result ends up flagged).
4. Normalize actions into `ReplayAction[]` (drop `undefined` optionals); a
   shape mismatch (swap without from/to, ult without element) → mark invalid.
5. `const r = replay(session.seed, session.mode, actions)` from `@engine/engine`.
6. **Timeline / timestamp validation** (see §3) → contributes to `invalid`.
7. **Wall-clock cross-check**: `Date.now() - session.startedAt` must be within
   a tolerance band of the replayed virtual end time (can't submit a 60s game
   3s after `startGame`). Out of band → invalid.
8. `flagged = r.invalid || timelineInvalid || wallClockInvalid`.
9. Insert into `leaderboard`: `{ nickname, score: r.score, hearts: r.hearts,
   mode: session.mode, createdAt: Date.now(), flagged }`. Return the `_id`.

Reuse the chat.ts:36 rate-limit pattern on `startGame` as an optional anti
seed-shopping throttle (residual risk, not blocking).

### 3. Timeline / timestamp validation (engine, `convex/engine/engine.ts`)
Add a pure validator (so it is unit-testable and shared):
- Add `JITTER_MS` to `convex/engine/config.ts` (e.g. 75).
- `t` monotonic non-decreasing; first action `t >= 0`.
- For consecutive actions: `a[i].t >= a[i-1].t + duration(a[i-1]) - JITTER_MS`,
  where `duration = (swap ? SWAP_ANIM_MS : 0) + numSteps*(CLEAR_ANIM_MS +
  FALL_ANIM_MS)` and `numSteps` is the deterministic cascade length already
  computed during replay. The board is locked during animation, so a smaller
  gap is physically impossible.
- Normal mode: total span ≤ effective duration (`GAME_DURATION_MS` + Σ Night
  bonuses) + `JITTER_MS`. Zen: a sane absolute cap.
- Surface this from `replay()` (e.g. extend `ReplayResult` with
  `timelineInvalid`/`reason`) so the mutation just reads flags — keep the
  arithmetic in the engine, not the mutation.
- Phase 1 caveat to close here: the engine does **not** yet enforce
  time-based game-over (only deadlock). Add: in normal mode an action whose
  `t` exceeds the effective time budget is illegal → invalid. Model the timer
  with the virtual clock; pauses are not in the log, so treat the budget as a
  generous upper bound (over-budget = invalid, not exact).

### 4. Leaderboard query — `convex/leaderboard.ts`
- `getTopScores`: exclude `flagged === true` (over-fetch + filter, or a
  flagged-excluding index). Bounded `.take()` as today.
- **Remove or lock `submitScore`.** Without this the console bypass remains and
  all of Phase 2 is pointless. Either delete it and migrate callers, or make it
  `throw` immediately. The game-over UI must no longer call it.

### 5. Client wiring
- `src/features/leaderboard/model/use-submit-score.ts`: replace the
  `api.leaderboard.submitScore` mutation with `api.sessions.submitRun`; payload
  becomes `{ gameId, nickname, actions }`.
- `src/widgets/game-over.tsx`: get `gameId` + `getActionLog()` from
  `useGameState` (already exposed in Phase 1) instead of passing `score`/
  `hearts`; the displayed score stays client-side for UX only.
- `src/pages/index.tsx`: thread `gameId` / `getActionLog` from the hook into
  `GameOverBlock`. Handle the local-seed fallback (`gameId === null`): submit
  is expected to be flagged — surface gracefully (still submit, or skip).
- Confirm a forged console `submitScore` no longer exists/works.

### 6. Tests — `convex/engine/__tests__/`
- Timeline validator: gaps under/over `JITTER_MS` → expected
  valid/invalid; over-budget normal-mode action → invalid.
- Wall-clock band logic (pure helper).
- `convex-test` mutation tests for `submitRun` (install `convex-test`,
  `@edge-runtime/vm`, set `environment: "edge-runtime"` per Convex
  guidelines): happy path stores server score; tampered actions →
  `flagged: true`; reused session → flagged + one-shot; bad nickname → throws.
- `getTopScores` excludes flagged rows.

## Critical files
- Modify: `convex/schema.ts`, `convex/sessions.ts`, `convex/leaderboard.ts`,
  `convex/engine/engine.ts`, `convex/engine/config.ts`,
  `src/features/leaderboard/model/use-submit-score.ts`,
  `src/widgets/game-over.tsx`, `src/pages/index.tsx`.
- New tests under `convex/engine/__tests__/` (+ a `convex/*.test.ts` for
  `convex-test`).

## Residual risks (unchanged)
- Seed shopping (repeated `startGame`, submit only good seeds) — still a
  rules-valid score; optional `startGame` throttle.
- TAS/bot optimal play — replay only guarantees "achievable under the rules".
- Engine divergence under real timer jitter → honest runs flagged; mitigated by
  `JITTER_MS` tolerance + shadow flag (not hard reject) + parity tests.
- Legacy pre-`flagged` leaderboard rows remain visible (accepted).

## Verification
- `pnpm test` green incl. new timeline/mutation suites.
- `pnpm typecheck` + `npx convex codegen` clean.
- Manual: play normal + zen, time-out + deadlock endings, each of the 6 ults;
  submitted score == server replay score; tampered action log lands
  `flagged: true` and is absent from the public top; a clean run appears.
- Confirm the old `submitScore` path is gone/locked.
