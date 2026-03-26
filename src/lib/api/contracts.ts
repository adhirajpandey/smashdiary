import type { GameFormFieldErrors } from "@/lib/action-errors";
import type { GameFormat, WinnerSide } from "@/lib/types";

export type PlayerDto = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type ResolvedGameDto = {
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
  sideAPlayers: PlayerDto[];
  sideBPlayers: PlayerDto[];
};

export type GameUpsertRequest = {
  playedAt: string;
  format: GameFormat;
  sideAScore: number;
  sideBScore: number;
  sideAPlayers: string[];
  sideBPlayers: string[];
};

export type GameUpsertResponse = {
  id: string;
};

export type DashboardResponse = {
  metrics: {
    playerId: string;
    playerName: string;
    winScore: number;
    playerRating: number;
    wins: number;
    losses: number;
    singlesGames: number;
    doublesGames: number;
    recentMatches: ResolvedGameDto[];
  } | null;
  topPerformers: Array<{
    playerId: string;
    playerName: string;
    wins: number;
    rating: number;
  }>;
};

export type PlayerStatsResponse = {
  playerId: string;
  playerName: string;
  totalMatches: number;
  wins: number;
  losses: number;
  recentForm: Array<"W" | "L">;
  singlesGames: number;
  doublesGames: number;
} | null;

export type ApiErrorResponse = {
  message: string;
  fieldErrors?: GameFormFieldErrors;
  code?: string;
};
