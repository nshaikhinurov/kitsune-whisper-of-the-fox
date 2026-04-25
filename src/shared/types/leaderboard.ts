export type GameMode = "normal" | "zen";

export interface LeaderboardEntry {
  _id: string;
  _creationTime: number;
  nickname: string;
  score: number;
  stars: number;
  level: number;
  mode: GameMode;
  createdAt: number;
}
