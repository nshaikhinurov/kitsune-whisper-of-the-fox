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

export const FOX_DEFS: Record<FoxElement, FoxDef> = {
  ori: {
    element: "ori",
    name: "Ori Fox",
    rarity: "common",
    borderColor: "#94a3b8",
    textColor: "#334155",
    accentColor: FOX_COLORS.ori.primary,
    ultDescription: "Changes random tiles to random elements",
  },
  green: {
    element: "green",
    name: "Green Fox",
    rarity: "common",
    borderColor: "#b91c1c",
    textColor: "#ffffff",
    accentColor: FOX_COLORS.green.primary,
    ultDescription: "Destroys random tiles (claws them away)",
  },
  electric: {
    element: "electric",
    name: "Electric Fox",
    rarity: "common",
    borderColor: "#ca8a04",
    textColor: "#713f12",
    accentColor: FOX_COLORS.electric.primary,
    ultDescription: "Removes entire column",
  },
  chaotic: {
    element: "chaotic",
    name: "Chaotic Fox",
    rarity: "common",
    borderColor: "#6d28d9",
    textColor: "#ffffff",
    accentColor: FOX_COLORS.chaotic.primary,
    ultDescription: "Shuffles a region of tiles",
  },
  night: {
    element: "night",
    name: "Night Fox",
    rarity: "rare",
    borderColor: "#eab308",
    textColor: "#eab308",
    accentColor: FOX_COLORS.night.primary,
    ultDescription: "Dark theme + extra time",
  },
  sakura: {
    element: "sakura",
    name: "Sakura Fox",
    rarity: "rare",
    borderColor: "#db2777",
    textColor: "#ffffff",
    accentColor: FOX_COLORS.sakura.primary,
    ultDescription: "Collects stars from random tiles",
  },
};
