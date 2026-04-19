export type FoxElement =
  | "ori"
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
  bgColor: string; // CSS hex color for tile background
  borderColor: string; // CSS hex color for tile border
  textColor: string; // CSS hex color for text/emoji
  accentColor: string; // CSS hex color for spirit charge bar
  ultDescription: string;
}

export interface TileState {
  tileId: string;
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
  ori: number;
  red: number;
  electric: number;
  chaotic: number;
  night: number;
  sakura: number;
}

export interface GameState {
  board: CellState[][]; // rows × cols
  score: number;
  timeLeft: number; // milliseconds remaining
  level: number;
  combo: number; // current cascade chain length
  lastMatchElement: FoxElement | null;
  consecutiveSameElement: number;
  spiritCharge: SpiritCharge;
  gems: number; // collected gems total
  selected: Position | null; // first tile of a swap
  isDarkTheme: boolean; // Night Fox ult active
  isTimeSlow: boolean; // Night Fox ult active
  phase: "idle" | "swapping" | "clearing" | "falling" | "gameOver";
  lastElectricCol: number; // column of last matched electric tile
}
