import { TILE_DEFS, TileSprite } from "~/entities/tile";
import type { TileState } from "~/shared/types/game";
import { HeartIcon } from "~/shared/ui/heart-icon";

interface TileProps {
  tile: TileState;
}

export function Tile({ tile }: TileProps) {
  const def = TILE_DEFS[tile.element];

  return (
    <div
      className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-lg select-none"
      style={{ color: def.textColor }}
    >
      <TileSprite
        element={tile.element}
        className="absolute bottom-0 left-1/2 h-8/10 -translate-x-1/2"
      />

      {tile.hasHeart && (
        <HeartIcon className="absolute top-[6.67%] left-1/2 aspect-square w-1/5 -translate-x-1/2 animate-pulse" />
      )}
    </div>
  );
}
