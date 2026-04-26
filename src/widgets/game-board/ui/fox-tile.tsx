import { FOX_DEFS, FoxSprite } from "../../../entities/fox";
import { StarIcon } from "../../../shared/ui/star-icon";
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

      {tile.hasStar && (
        <StarIcon className="absolute top-2 left-1/2 aspect-square w-5 -translate-x-1/2 animate-pulse" />
      )}
    </div>
  );
}
