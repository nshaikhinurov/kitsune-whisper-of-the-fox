// Pure game value types now live in the deterministic engine (single source of
// truth shared with the server). UI-only types stay here.
export type {
  CellState,
  Match,
  Position,
  SpiritCharge,
  TileElement,
  TileState,
} from "@engine/types";

import type { CellState, Position, SpiritCharge, TileElement } from "@engine/types";

export type Rarity = "common" | "rare";

export interface TileDef {
  element: TileElement;
  name: string;
  rarity: Rarity;
  borderColor: string; // CSS hex color for tile border
  textColor: string; // CSS hex color for text/emoji
  accentColor: string; // CSS hex color for spirit charge bar
  catDark: string; // dark color extracted from cat SVG (paw + border)
  catLight: string; // light color extracted from cat SVG (circle background)
  ultDescription: string;
}

export interface ScoreFlash {
  delta: number;
  row: number;
  col: number;
  id: number;
}

export interface GameState {
  board: CellState[][]; // rows × cols
  score: number;
  timeLeft: number; // milliseconds remaining
  timerStarted: boolean; // true after first successful swap
  combo: number; // current cascade chain length
  lastMatchElement: TileElement | null;
  consecutiveSameElement: number;
  spiritCharge: SpiritCharge;
  hearts: number; // collected hearts total
  dragSource: Position | null; // tile currently being dragged for a swipe
  isNight: boolean; // Night tile ult active
  phase: "idle" | "swapping" | "clearing" | "falling" | "gameOver";
  gameOverReason: "time" | "deadlock";
  lastElectricCol: number; // column of last matched electric tile
  hintPositions: [Position, Position] | null;
  scoreFlash: ScoreFlash | null;
}
