// Board logic is the single source of truth in @engine/board (shared with the
// server replay). It is RNG-injected: createBoard/refillBoard take a TileFactory
// and pickRandomNonNullCells/shuffleRegion take an Rng, so the game must build a
// seeded factory (createTileFactory) per game and thread it through.
export {
  applyGravity,
  createBoard,
  createTileFactory,
  isAdjacent,
  pickRandomNonNullCells,
  refillBoard,
  shuffleRegion,
  swapTiles,
  type TileFactory,
} from "@engine/board";
