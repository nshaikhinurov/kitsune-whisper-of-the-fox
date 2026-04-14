# Fox Spirit Match-3 — Implementation Plan

## Context

Build a Candy Crush-style match-3 game in React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui (Base UI primitives) + motion.dev. The player swaps adjacent fox tiles to create matches of 3+ in a row/column. Each fox represents an element. Sequential combos of the same element charge that fox's "spirit ult" — a unique ability the player can activate manually. Fox tiles may contain gems used in a future upgrade store.

**MVP scope:** Core match-3 mechanics + fox tile visuals + score/combo system + spirit charge UI.

---

## Fox Roster

| Fox                    | Rarity | Color         | Spirit Ult                                      |
| ---------------------- | ------ | ------------- | ----------------------------------------------- |
| White Fox              | Common | white/gray    | Changes random tiles to random elements         |
| Red Fox                | Common | red           | Destroys random tiles (claws them away)         |
| Electric Yellow Fox    | Common | yellow        | Removes entire column                           |
| Violet Chaotic Fox     | Common | violet/purple | Shuffles a region of tiles                      |
| Black-Golden Night Fox | Rare   | black + gold  | Dark theme + time-slow (more moves temporarily) |
| Pink Sakura Fox        | Rare   | pink          | Collects gems from random tiles                 |

---

## File Structure

```
src/
├── app.tsx                        ← root, renders game
├── types.ts                       ← all TS interfaces/types
├── constants.ts                   ← fox definitions, grid config
├── hooks/
│   └── use-game-state.ts            ← all game logic + state
├── utils/
│   ├── board.ts                   ← fill, gravity, shuffle helpers
│   └── matches.ts                 ← match detection algorithm
└── components/
    ├── board.tsx                  ← grid renderer
    ├── cell.tsx                   ← single cell with selection state
    ├── fox-tile.tsx                ← fox visual + gem dot + upgrade stars
    ├── spirit-panel.tsx            ← 6 charge bars + activate button
    └── hud.tsx                    ← score, combo, moves, gems count
```

---

## Types (`src/types.ts`)

```typescript
export type FoxElement =
  | "white"
  | "red"
  | "electric"
  | "chaotic"
  | "night"
  | "sakura";
export type Rarity = "common" | "rare";

export interface FoxDef {
  element: FoxElement;
  name: string;
  rarity: Rarity;
  color: string; // Tailwind bg color class
  borderColor: string; // Tailwind border color class
  textColor: string; // Tailwind text color class
  emoji: string; // placeholder visual until SVG assets arrive
  ultDescription: string;
  upgradeLevel: number; // 1–5, starts at 1
}

export interface TileState {
  element: FoxElement;
  hasGem: boolean;
}

export type CellState = TileState | null; // null = hole

export interface Position {
  row: number;
  col: number;
}

export interface Match {
  positions: Position[];
  element: FoxElement;
}

export interface SpiritCharge {
  white: number;
  red: number;
  electric: number;
  chaotic: number;
  night: number;
  sakura: number;
}

export interface GameState {
  board: CellState[][]; // rows × cols
  score: number;
  movesLeft: number;
  level: number;
  combo: number; // current chain length
  lastMatchElement: FoxElement | null;
  consecutiveSameElement: number;
  spiritCharge: SpiritCharge;
  gems: number; // collected gems total
  selected: Position | null; // first tile of a swap
  isDarkTheme: boolean; // Night Fox ult active
  isTimeSlow: boolean; // Night Fox ult active
  phase: "idle" | "animating" | "gameOver";
}
```

---

## Constants (`src/constants.ts`)

- `FOX_DEFS: Record<FoxElement, FoxDef>` — all six fox definitions
- `GRID_COLS = 6`, `GRID_ROWS = 6` (for MVP level 1)
- `BASE_MOVES = 30`
- `SPIRIT_CHARGE_PER_MATCH = 15` (increases per combo)
- `SPIRIT_MAX = 100`
- `GEM_SPAWN_CHANCE = 0.12` — ~12% of tiles have a gem
- `ELEMENTS: FoxElement[]` — array used for random tile generation

---

## Core Logic

### `src/utils/matches.ts`

- `findMatches(board): Match[]` — scan all rows + columns for 3+ consecutive same-element tiles
- `positionsToSet(matches): Set<string>` — flatten matches to a set of "r,c" strings for fast lookup

### `src/utils/board.ts`

- `createBoard(rows, cols): CellState[][]` — fill with random fox tiles, no initial matches
- `applyGravity(board): CellState[][]` — shift tiles down into empty cells
- `refillBoard(board, rows, cols): CellState[][]` — fill nulls from top with new random tiles
- `isAdjacent(a, b): boolean`
- `swapTiles(board, a, b): CellState[][]`
- `shuffleRegion(board, positions): CellState[][]`

### `src/hooks/use-game-state.ts`

State: `GameState` (above)

Key actions:

- `selectCell(pos)` — first click selects; second click on adjacent triggers swap
- `processSwap(a, b)` — swap → `findMatches` → if no matches revert; else cascade loop
- `cascadeLoop(board)` — repeatedly: remove matches → apply gravity → refill → find new matches → repeat until stable; accumulate score + combo + spirit charge
- `activateUlt(element)` — if charge >= 100: execute ult effect, reset charge to 0

Ult implementations inside the hook:

- `ultWhite()` — randomly re-element 4–6 tiles
- `ultRed()` — destroy 3–5 random tiles (set to null, trigger gravity)
- `ultElectric(col)` — clear the column of last matched yellow tile
- `ultChaotic()` — shuffle random 3×3 region
- `ultNight()` — set `isDarkTheme = true`, `isTimeSlow = true`, add +5 moves, timeout revert after 10s
- `ultSakura()` — collect gems from 4–6 random tiles that have gems

---

## Components

### `board.tsx`

- Renders `rows × cols` grid using CSS Grid (`grid grid-cols-6`)
- Passes `selected` state down to cells for highlight

### `cell.tsx`

Props: `tile: CellState`, `pos: Position`, `isSelected: bool`, `isMatch: bool`, `onClick`

- If `tile === null` → render empty dark hole cell
- Else render `<FoxTile />`
- Selected: ring highlight; matched: brief scale animation (Tailwind `scale-110 transition`)

### `fox-tile.tsx`

Props: `tile: TileState`, fox def looked up from `FOX_DEFS`

- Background = fox color (`bg-red-500`, `bg-yellow-400`, etc.)
- Emoji rendered centered as placeholder art
- Small gem dot (bottom-right) if `hasGem`
- Tiny stars row (bottom-left) for `upgradeLevel` (1–5 dots)
- Rare foxes get a gold border glow

### `spirit-panel.tsx`

- Renders a row of 6 fox portraits with charge bars beneath each
- Charge bar fills with color of fox element
- Glowing "ACTIVATE" button appears when charge >= 100
- Greyed out otherwise

### `hud.tsx`

- Score (with combo multiplier flash)
- Moves left counter
- Gems collected
- Level indicator

---

## Scoring

- Base: 10 pts per matched tile
- Combo multiplier: `score × (1 + 0.5 × (combo - 1))`
- Same-element sequential combos also charge spirit: `+SPIRIT_CHARGE_PER_MATCH × combo` for that element

---

## App Layout (`src/app.tsx`)

```
<div class="flex flex-col items-center min-h-screen bg-...">
  <HUD />
  <SpiritPanel />
  <Board />
</div>
```

Dark theme: conditionally apply `dark` class to root div when `isDarkTheme` is true + Tailwind dark variants.

---

## Implementation Steps

### Phase 1 — Data Layer

- [x] Create `src/types.ts` with all interfaces and types
- [x] Create `src/constants.ts` with `FOX_DEFS`, grid config, and game constants

### Phase 2 — Core Utilities

- [x] Create `src/utils/matches.ts` — `findMatches()` and `positionsToSet()`
- [x] Create `src/utils/board.ts` — `createBoard()`, `applyGravity()`, `refillBoard()`, `swapTiles()`, `isAdjacent()`, `shuffleRegion()`

### Phase 3 — Game State Hook

- [x] Create `src/hooks/use-game-state.ts` with full `GameState`
- [x] Implement `selectCell()` and `processSwap()` (swap + revert if no match)
- [x] Implement `cascadeLoop()` — remove matches → gravity → refill → repeat
- [x] Implement score and combo accumulation in cascade
- [x] Implement spirit charge accumulation per element

### Phase 4 — Tile Components

- [x] Create `src/components/fox-tile.tsx` — colored tile, emoji, gem dot, upgrade stars, rare glow
- [x] Create `src/components/cell.tsx` — selection ring, match animation, hole rendering

### Phase 5 — Board

- [x] Create `src/components/board.tsx` — CSS grid layout, wire click handlers

### Phase 6 — UI Chrome

- [x] Create `src/components/hud.tsx` — score, combo flash, moves left, gems, level
- [x] Create `src/components/spirit-panel.tsx` — 6 charge bars, activate button per fox

### Phase 7 — Wire Up App

- [x] Update `src/app.tsx` — compose all components, pass state/actions down
- [x] Implement dark theme toggle via `isDarkTheme` on root div

### Phase 8 — Spirit Ults

- [x] Implement `ultWhite()` — re-element random tiles
- [x] Implement `ultRed()` — destroy random tiles + cascade
- [x] Implement `ultElectric()` — clear full column + cascade
- [x] Implement `ultChaotic()` — shuffle 3×3 region
- [x] Implement `ultNight()` — dark theme + time slow + extra moves, auto-revert after 10s
- [x] Implement `ultSakura()` — collect gems from gem tiles

### Phase 9 — Polish

- [x] Tile swap animation (motion layoutId slide)
- [x] Match pop / clear animation (AnimatePresence exit scale/fade)
- [x] Cascade fall animation (sequential: swap → clear → fall, each step timed)
- [x] Spirit bar fill animation
- [x] Game over screen with score summary
- [x] Night Fox dark theme transition

### Phase 10 — Post-MVP (future)

- [ ] Level system with objectives and grid progression
- [ ] Irregular grid shapes and hole tiles
- [ ] Caged tiles that must be freed
- [ ] Gem store and fox upgrade system
- [ ] Persistent save state (localStorage)
- [ ] Replace emoji placeholders with fox SVG artwork

---

## Verification

- `pnpm typecheck` — run TypeScript type checks
- Dev server is **always already running** — open browser directly (do not run `pnpm dev`)
- Swap two adjacent tiles → matches clear, tiles fall, score updates
- Chain combos → combo counter increments, spirit bars charge
- Charge a bar to 100 → activate button lights up → click → ult fires
- Night Fox ult → UI darkens, timer appears, reverts after timeout
- Sakura ult → gem count in HUD increases
- Red Fox ult → tiles disappear with cascade
- No moves left → game over screen
