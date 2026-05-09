export type GameMode = "normal" | "zen";

export interface LeaderboardEntry {
  _id: string;
  _creationTime: number;
  nickname: string;
  score: number;
  hearts: number;
  mode: GameMode;
  createdAt: number;
}
