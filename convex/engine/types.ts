// Pure game value types shared by the client and the server replay engine.
// UI-only types (TileDef colors, ScoreFlash, the React GameState) stay in
// src/shared/types/game.ts, which re-exports these.

export type TileElement =
  | "ori"
  | "green"
  | "electric"
  | "chaotic"
  | "night"
  | "sakura";

export interface TileState {
  tileId: string;
  element: TileElement;
  hasHeart: boolean;
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
