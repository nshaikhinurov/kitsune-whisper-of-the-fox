import type { FoxElement, SpiritCharge } from "../types/game";

export const GRID_COLS = 6;
export const GRID_ROWS = 6;
export const GAME_DURATION_MS = 90_000;
export const NIGHT_FOX_TIME_BONUS_MS = 15_000;
export const SPIRIT_CHARGE_PER_MATCH = 15;
export const SPIRIT_MAX = 100;
export const GEM_SPAWN_CHANCE = 0.12;

export const ELEMENTS: FoxElement[] = [
  "white",
  "red",
  "electric",
  "chaotic",
  "night",
  "sakura",
];

export const INITIAL_SPIRIT_CHARGE: SpiritCharge = {
  white: 0,
  red: 0,
  electric: 0,
  chaotic: 0,
  night: 0,
  sakura: 0,
};
