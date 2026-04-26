import { FOX_DEFS, FoxSprite } from "../../../entities/fox";
import type { TileState } from "../../../shared/types/game";

interface FoxTileProps {
  tile: TileState;
}

export function FoxTile({ tile }: FoxTileProps) {
  const def = FOX_DEFS[tile.element];

  return (
    <div
      className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-lg select-none"
      style={{ color: def.textColor }}
    >
      <FoxSprite element={tile.element} className="aspect-square w-8/10" />

      {/* TODO: remove — debug label
      <span className="absolute bottom-0 left-0 right-0 text-center text-[8px] font-bold leading-tight text-white/80 bg-black/40">
        {tile.element}
      </span> */}

      {tile.hasStar && (
        <img
          src="/star.svg"
          alt="star"
          className="absolute top-2 left-1/2 aspect-square w-5 -translate-x-1/2 animate-pulse"
        />
      )}
    </div>
  );
}
