import type { TileElement } from "~/shared/types/game";

interface TileSpriteProps {
  element: TileElement;
  className?: string;
}

export function TileSprite({ element, className }: TileSpriteProps) {
  return (
    <img
      src={`/imgs/${element}-cat.svg`}
      alt={element}
      draggable={false}
      className={`pointer-events-none${className ? ` ${className}` : ""}`}
    />
  );
}
