import type { FoxDef, FoxElement, SpiritCharge } from "./types";

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

export const FOX_DEFS: Record<FoxElement, FoxDef> = {
  white: {
    element: "white",
    name: "White Fox",
    rarity: "common",
    bgColor: "#e2e8f0",
    borderColor: "#94a3b8",
    textColor: "#334155",
    accentColor: "#cbd5e1",
    emoji: "🦊",
    ultDescription: "Changes random tiles to random elements",
  },
  red: {
    element: "red",
    name: "Red Fox",
    rarity: "common",
    bgColor: "#ef4444",
    borderColor: "#b91c1c",
    textColor: "#ffffff",
    accentColor: "#ef4444",
    emoji: "🔥",
    ultDescription: "Destroys random tiles (claws them away)",
  },
  electric: {
    element: "electric",
    name: "Electric Yellow Fox",
    rarity: "common",
    bgColor: "#facc15",
    borderColor: "#ca8a04",
    textColor: "#713f12",
    accentColor: "#facc15",
    emoji: "⚡",
    ultDescription: "Removes entire column",
  },
  chaotic: {
    element: "chaotic",
    name: "Violet Chaotic Fox",
    rarity: "common",
    bgColor: "#8b5cf6",
    borderColor: "#6d28d9",
    textColor: "#ffffff",
    accentColor: "#8b5cf6",
    emoji: "🌀",
    ultDescription: "Shuffles a region of tiles",
  },
  night: {
    element: "night",
    name: "Black-Golden Night Fox",
    rarity: "rare",
    bgColor: "#0f172a",
    borderColor: "#eab308",
    textColor: "#eab308",
    accentColor: "#eab308",
    emoji: "🌙",
    ultDescription: "Dark theme + time-slow (more moves temporarily)",
  },
  sakura: {
    element: "sakura",
    name: "Pink Sakura Fox",
    rarity: "rare",
    bgColor: "#f472b6",
    borderColor: "#db2777",
    textColor: "#ffffff",
    accentColor: "#f472b6",
    emoji: "🌸",
    ultDescription: "Collects gems from random tiles",
  },
};

export const INITIAL_SPIRIT_CHARGE: SpiritCharge = {
  white: 0,
  red: 0,
  electric: 0,
  chaotic: 0,
  night: 0,
  sakura: 0,
};
