// Canonical game constants used by the deterministic engine. The client's
// src/shared/config/game-config.ts re-exports these and adds UI-only constants.
// Changing any value here changes both client gameplay and server scoring — keep
// them identical by construction (single source of truth).

import type { SpiritCharge, TileElement } from "./types";

// Grid
export const GRID_COLS = 6;
export const GRID_ROWS = 6;

// Timer
export const GAME_DURATION_MS = 60_000;

// Scoring
export const SCORE_PER_HEART = 50;
export const COMBO_MULT_STEP = 0.1;
export const COMBO_RESET_MS = 2_000;

// Spirit / ultimates
export const SPIRIT_MAX = 100;
export const SPIRIT_CHARGE_PER_MATCH = 20;
export const NIGHT_TIME_BONUS_MS = 15_000;
export const WHITE_MIN_TILES = 4;
export const WHITE_TILE_VARIANCE = 3;
export const RED_MIN_TILES = 3;
export const RED_TILE_VARIANCE = 3;
export const CHAOTIC_PATCH_SIZE = 3;
export const SAKURA_MIN_HEARTS = 4;
export const SAKURA_HEART_VARIANCE = 3;

// Board generation
export const HEART_SPAWN_CHANCE = 0.12;
export const MIN_MATCH_LENGTH = 3;
export const BOARD_MATCH_REMOVAL_ATTEMPTS = 100;
export const BOARD_GEN_ATTEMPTS = 50;
export const BOARD_REFILL_ATTEMPTS = 50;

// Animation durations — also drive the server's virtual-clock combo timeline,
// so they are part of the scoring contract, not just visuals.
export const SWAP_ANIM_MS = 230;
export const CLEAR_ANIM_MS = 190;
export const FALL_ANIM_MS = 330;

// Replay timeline validation tolerances (server-authoritative, Phase 2).
// JITTER_MS absorbs setTimeout/raf imprecision in the recorded `t` spacing;
// the board is locked during animation so a smaller-than-animation gap is
// physically impossible beyond this slack.
export const JITTER_MS = 75;
// Real wall-clock elapsed (Date.now() - startedAt) must be at least the last
// action's virtual `t` minus this band (network + startGame latency + skew).
export const WALLCLOCK_TOLERANCE_MS = 5_000;
// Zen has no countdown; cap the total virtual span at a sane upper bound so a
// run can't claim an implausibly long session.
export const ZEN_MAX_GAME_MS = 3 * 60 * 60 * 1_000;

export const ELEMENTS: TileElement[] = [
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
