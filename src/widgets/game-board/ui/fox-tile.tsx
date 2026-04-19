import { motion } from "motion/react";
import { FOX_DEFS, FoxSprite } from "../../../entities/fox";
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
      <FoxSprite element={tile.element} className="w-8/10 aspect-square" />

      {/* TODO: remove — debug label
      <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold leading-tight text-white/80 bg-black/40">
        {tile.element}
      </span> */}

      {tile.hasGem && (
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-2xl leading-none">
          💎
        </span>
      )}
    </motion.div>
  );
}
