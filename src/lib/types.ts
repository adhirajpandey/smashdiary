export type GameFormat = "singles" | "doubles";

export type WinnerSide = "A" | "B";

export type Player = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Game = {
  id: string;
  playedAt: string;
  format: GameFormat;
  sideAPlayerIds: string[];
  sideBPlayerIds: string[];
  sideAScore: number;
  sideBScore: number;
  winnerSide: WinnerSide;
  createdAt: string;
  updatedAt: string;
};

export type DiaryStore = {
  players: Player[];
  games: Game[];
};

export type ResolvedGame = Game & {
  sideAPlayers: Player[];
  sideBPlayers: Player[];
};

export type PlayerStatsSummary = {
  playerId: string;
  playerName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  recentForm: Array<"W" | "L">;
  singlesGames: number;
  doublesGames: number;
};

export type PlayerDashboardMetrics = {
  playerId: string;
  playerName: string;
  winScore: number;
  playerRating: number;
  wins: number;
  losses: number;
  singlesGames: number;
  doublesGames: number;
  recentMatches: ResolvedGame[];
};

export type PlayerStanding = {
  playerId: string;
  playerName: string;
  wins: number;
  rating: number;
};
