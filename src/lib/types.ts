export type GameFormat = "singles" | "doubles";

export type WinnerSide = "A" | "B";

export const MATCH_SLOTS = [
  "12 AM",
  "1 AM",
  "2 AM",
  "3 AM",
  "4 AM",
  "5 AM",
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
  "11 PM",
] as const;

export type MatchSlot = (typeof MATCH_SLOTS)[number];

export type Player = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Game = {
  id: number;
  playedOn: string;
  slot: MatchSlot;
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
