export type TileElement =
  | "ori"
  | "green"
  | "electric"
  | "chaotic"
  | "night"
  | "sakura";

export type Rarity = "common" | "rare";

export interface TileDef {
  element: TileElement;
  name: string;
  rarity: Rarity;
  borderColor: string; // CSS hex color for tile border
  textColor: string; // CSS hex color for text/emoji
  accentColor: string; // CSS hex color for spirit charge bar
  ultDescription: string;
}

export interface TileState {
  tileId: string;
  element: TileElement;
  hasStar: boolean;
}

export type CellState = TileState | null; // null = hole

export interface Position {
  row: number;
  col: number;
}

export interface Match {
  positions: Position[];
  element: TileElement;
}

export type SpiritCharge = Record<TileElement, number>;

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
  combo: number; // current cascade chain length
  lastMatchElement: TileElement | null;
  consecutiveSameElement: number;
  spiritCharge: SpiritCharge;
  stars: number; // collected stars total
  selected: Position | null; // first tile of a swap
  isNight: boolean; // Night tile ult active
  phase: "idle" | "swapping" | "clearing" | "falling" | "gameOver";
  gameOverReason: "time" | "deadlock";
  lastElectricCol: number; // column of last matched electric tile
  hintPositions: [Position, Position] | null;
  scoreFlash: ScoreFlash | null;
}
