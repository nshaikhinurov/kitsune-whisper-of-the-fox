import type { TileDef, TileElement } from "~/shared/types/game";

export interface TileColors {
  /** Darker body patches — cls-1 */
  primary: string;
  /** Lighter body patches — cls-2 */
  secondary: string;
  /** Dark markings — cls-3 */
  dark: string;
}

export const TILE_COLORS: Record<TileElement, TileColors> = {
  ori: {
    primary: "oklch(60% 0.16 58)",
    secondary: "oklch(75% 0.10 58)",
    dark: "oklch(18% 0.04 0.00)",
  },
  green: {
    primary: "oklch(60% 0.16 120)",
    secondary: "oklch(75% 0.10 120)",
    dark: "oklch(18% 0.04 0.00)",
  },
  electric: {
    primary: "oklch(60% 0.16 292.759)",
    secondary: "oklch(75% 0.10 292.759)",
    dark: "oklch(18% 0.04 0.00)",
  },
  chaotic: {
    primary: "oklch(60% 0.16 17.58)",
    secondary: "oklch(75% 0.10 17.58)",
    dark: "oklch(18% 0.04 0.00)",
  },
  night: {
    primary: "oklch(60% 0.16 262)",
    secondary: "oklch(75% 0.10 262)",
    dark: "oklch(18% 0.04 0.00)",
  },
  sakura: {
    primary: "oklch(60% 0.16 333.49)",
    secondary: "oklch(75% 0.10 333.49)",
    dark: "oklch(18% 0.04 0.00)",
  },
};

export const TILE_DEFS: Record<TileElement, TileDef> = {
  ori: {
    element: "ori",
    name: "Ori",
    rarity: "common",
    borderColor: "#94a3b8",
    textColor: "#334155",
    accentColor: TILE_COLORS.ori.primary,
    catDark: "#e17100",
    catLight: "#ffb900",
    ultDescription: "Changes random tiles to random elements",
  },
  green: {
    element: "green",
    name: "Green",
    rarity: "common",
    borderColor: "#b91c1c",
    textColor: "#ffffff",
    accentColor: TILE_COLORS.green.primary,
    catDark: "#009a72",
    catLight: "#9fd9c3",
    ultDescription: "Destroys random tiles (claws them away)",
  },
  electric: {
    element: "electric",
    name: "Electric",
    rarity: "common",
    borderColor: "#ca8a04",
    textColor: "#713f12",
    accentColor: TILE_COLORS.electric.primary,
    catDark: "#008bd0",
    catLight: "#6cb8e5",
    ultDescription: "Removes entire column",
  },
  chaotic: {
    element: "chaotic",
    name: "Chaotic",
    rarity: "common",
    borderColor: "#6d28d9",
    textColor: "#ffffff",
    accentColor: TILE_COLORS.chaotic.primary,
    catDark: "#bf5297",
    catLight: "#db94bd",
    ultDescription: "Shuffles a region of tiles",
  },
  night: {
    element: "night",
    name: "Night",
    rarity: "rare",
    borderColor: "#eab308",
    textColor: "#eab308",
    accentColor: TILE_COLORS.night.primary,
    catDark: "#372aac",
    catLight: "#a3b3ff",
    ultDescription: "Dark theme + extra time",
  },
  sakura: {
    element: "sakura",
    name: "Sakura",
    rarity: "rare",
    borderColor: "#db2777",
    textColor: "#ffffff",
    accentColor: TILE_COLORS.sakura.primary,
    catDark: "#ce505a",
    catLight: "#e69495",
    ultDescription: "Collects hearts from random tiles",
  },
};
