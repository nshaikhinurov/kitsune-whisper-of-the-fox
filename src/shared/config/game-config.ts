import type { FoxElement, SpiritCharge } from "../types/game";

// Grid
export const GRID_COLS = 6;
export const GRID_ROWS = 6;

// Timer
export const ZEN_MODE_ON_INITIALLY = false;
export const GAME_DURATION_MS = 90_000;
export const TIMER_TICK_MS = 100;
export const TIME_WARNING_MS = 30_000;
export const TIME_LOW_MS = 10_000;

// Scoring
export const SCORE_PER_TILE = 10;
export const SCORE_PER_STAR = 50;
export const COMBO_MULT_STEP = 0.1;
export const COMBO_RESET_MS = 2_000;

// Spirit / ultimates
export const SPIRIT_MAX = 100;
export const SPIRIT_CHARGE_PER_MATCH = 15;
export const NIGHT_FOX_TIME_BONUS_MS = 15_000;
export const NIGHT_FOX_ACTIVE_MS = 10_000;
export const WHITE_FOX_MIN_TILES = 4;
export const WHITE_FOX_TILE_VARIANCE = 3;
export const RED_FOX_MIN_TILES = 3;
export const RED_FOX_TILE_VARIANCE = 3;
export const CHAOTIC_PATCH_SIZE = 3;
export const SAKURA_MIN_STARS = 4;
export const SAKURA_STAR_VARIANCE = 3;

// Board generation
export const STAR_SPAWN_CHANCE = 0.12;
export const MIN_MATCH_LENGTH = 3;
export const BOARD_MATCH_REMOVAL_ATTEMPTS = 100;
export const BOARD_GEN_ATTEMPTS = 50;
export const BOARD_REFILL_ATTEMPTS = 50;

// Hint
export const HINT_IDLE_MS = 10_000;
export const SHOW_HINTS_INITIALLY = false;

// Animation
export const SWAP_ANIM_MS = 230;
export const CLEAR_ANIM_MS = 190;
export const FALL_ANIM_MS = 330;

export const ELEMENTS: FoxElement[] = [
  "ori",
  "green",
  "electric",
  "chaotic",
  "night",
  "sakura",
];

export const INITIAL_SPIRIT_CHARGE: SpiritCharge = {
  ori: 100,
  green: 100,
  electric: 100,
  chaotic: 100,
  night: 100,
  sakura: 100,
};
