import { motion } from "motion/react";
import { FOX_DEFS } from "../../../entities/fox";
import type { TileState } from "../../../shared/types/game";

interface FoxTileProps {
  tile: TileState;
  isSelected: boolean;
}

export function FoxTile({ tile, isSelected }: FoxTileProps) {
  const def = FOX_DEFS[tile.element];

  return (
    <motion.div
      className="relative flex items-center justify-center w-full h-full rounded-lg select-none cursor-pointer"
      animate={{
        scale: isSelected ? 1.1 : 1,
        boxShadow: isSelected
          ? `0 0 0 3px rgba(255,255,255,0.85), 0 0 12px rgba(255,255,255,0.4)`
          : "none",
      }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      style={{
        color: def.textColor,
        zIndex: isSelected ? 10 : 0,
      }}
    >
      {/* Fox SVG */}
      <img
        src={`/${tile.element}.svg`}
        alt={def.name}
        className="w-8/10 aspect-square object-contain"
      />

      {/* Gem dot — bottom right */}
      {tile.hasGem && (
        <span
          className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-white/60"
          style={{ backgroundColor: "#60a5fa" }}
          title="Gem"
        />
      )}
    </motion.div>
  );
}
