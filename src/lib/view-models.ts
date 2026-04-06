import type { LeaderboardData, Player, PlayerDashboardMetrics, PlayerStatsSummary, ResolvedGame, StatsFormat } from "@/lib/types";

export type MatchFeedItem = {
  id: number;
  playedOn: string;
  slot: ResolvedGame["slot"];
  format: ResolvedGame["format"];
  result: "Victory" | "Defeat" | null;
  ownSideNames: string[];
  opposingSideNames: string[];
  scoreFor: number;
  scoreAgainst: number;
};

export type PlayersData = {
  players: Player[];
};

export type DashboardData = {
  format: StatsFormat;
  metrics: PlayerDashboardMetrics | null;
  leaderboard: LeaderboardData;
  recentMatches: MatchFeedItem[];
};

export type MatchesData = {
  format: StatsFormat;
  selectedPlayerName: string | null;
  matches: MatchFeedItem[];
};

export type MatchDetailData = {
  match: ResolvedGame;
};

export type StatsData = {
  format: StatsFormat;
  summary: PlayerStatsSummary | null;
  metrics: PlayerDashboardMetrics | null;
  leaderboard: LeaderboardData;
};
