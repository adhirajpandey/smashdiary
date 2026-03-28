export type GameFormat = "singles" | "doubles";

export type WinnerSide = "A" | "B";

export type Player = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Game = {
  id: number;
  playedAt: string;
  format: GameFormat;
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
  playerId: number;
  playerName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  recentForm: Array<"W" | "L">;
  singlesGames: number;
  doublesGames: number;
  singlesWins: number;
  singlesLosses: number;
  doublesWins: number;
  doublesLosses: number;
};

export type PlayerDashboardMetrics = {
  playerId: number;
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
  playerId: number;
  playerName: string;
  wins: number;
  rating: number;
};
