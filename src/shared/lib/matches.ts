// Match logic is the single source of truth in @engine/matches (shared with the
// server replay). This is a thin re-export to keep client import paths stable.
export {
  findFirstHintMove,
  findMatches,
  hasPossibleMove,
  parseKey,
  positionsToSet,
  posKey,
} from "@engine/matches";
