// Engine-relevant constants are the single source of truth in @engine/config
// (shared with the server replay). UI-only constants stay here.
export {
  BOARD_GEN_ATTEMPTS,
  BOARD_MATCH_REMOVAL_ATTEMPTS,
  BOARD_REFILL_ATTEMPTS,
  CHAOTIC_PATCH_SIZE,
  CLEAR_ANIM_MS,
  COMBO_MULT_STEP,
  COMBO_RESET_MS,
  ELEMENTS,
  FALL_ANIM_MS,
  GAME_DURATION_MS,
  GRID_COLS,
  GRID_ROWS,
  HEART_SPAWN_CHANCE,
  INITIAL_SPIRIT_CHARGE,
  MIN_MATCH_LENGTH,
  NIGHT_TIME_BONUS_MS,
  RED_MIN_TILES,
  RED_TILE_VARIANCE,
  SAKURA_HEART_VARIANCE,
  SAKURA_MIN_HEARTS,
  SCORE_PER_HEART,
  SPIRIT_CHARGE_PER_MATCH,
  SPIRIT_MAX,
  SWAP_ANIM_MS,
  WHITE_MIN_TILES,
  WHITE_TILE_VARIANCE,
} from "@engine/config";

// UI / hook-only constants (not part of the scoring contract)
export const ZEN_MODE_ON_INITIALLY = false;
export const TIMER_TICK_MS = 100;
export const SCORE_PER_TILE = 10;
export const NIGHT_ACTIVE_MS = 10_000;

// Hint
export const HINT_IDLE_MS = 10_000;
export const SHOW_HINTS_INITIALLY = false;

// Tile motion durations (seconds — consumed directly by Motion transitions)
export const TILE_LAYOUT_DURATION = 0.2; // swap / fall sliding
export const TILE_SCALE_DURATION = 0.18; // select / entry pop
export const TILE_OPACITY_DURATION = 0.15; // fade in
export const TILE_BOXSHADOW_DURATION = 0.18; // non-hint shadow settle
export const TILE_HINT_PULSE_DURATION = 0.9; // looped hint glow
export const TILE_EXIT_DURATION = 0.15; // disappearance on clear
