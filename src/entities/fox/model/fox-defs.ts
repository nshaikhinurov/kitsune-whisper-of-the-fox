import type { FoxDef, FoxElement } from "../../../shared/types/game";

export interface FoxColors {
  /** Darker body patches — cls-1 */
  primary: string;
  /** Lighter body patches — cls-2 */
  secondary: string;
  /** Dark markings — cls-3 */
  dark: string;
}

export const FOX_COLORS: Record<FoxElement, FoxColors> = {
  chaotic: {
    primary: "oklch(60% 0.16 17.58)",
    secondary: "oklch(70% 0.12 17.58)",
    dark: "oklch(18% 0.04 0.00)",
  },
  electric: {
    primary: "oklch(60% 0.16 292.759)",
    secondary: "oklch(70% 0.12 292.759)",
    dark: "oklch(18% 0.04 0.00)",
  },
  red: {
    primary: "oklch(60% 0.16 31.15)",
    secondary: "oklch(70% 0.12 31.15)",
    dark: "oklch(18% 0.04 0.00)",
  },
  ori: {
    primary: "oklch(60% 0.16 58)",
    secondary: "oklch(70% 0.12 58)",
    dark: "oklch(18% 0.04 0.00)",
  },
  night: {
    primary: "oklch(60% 0.16 262)",
    secondary: "oklch(70% 0.12 262)",
    dark: "oklch(18% 0.04 0.00)",
  },
  sakura: {
    primary: "oklch(60% 0.16 333.49)",
    secondary: "oklch(70% 0.12 333.49)",
    dark: "oklch(18% 0.04 0.00)",
  },
};

export const FOX_DEFS: Record<FoxElement, FoxDef> = {
  ori: {
    element: "ori",
    name: "White Fox",
    rarity: "common",
    bgColor: "#e2e8f0",
    borderColor: "#94a3b8",
    textColor: "#334155",
    accentColor: "#cbd5e1",
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
    ultDescription: "Collects gems from random tiles",
  },
};
