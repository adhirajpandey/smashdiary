import type { Player, PlayerDashboardMetrics, PlayerStanding, PlayerStatsSummary, ResolvedGame } from "@/lib/types";

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
  metrics: PlayerDashboardMetrics | null;
  leaderboard: PlayerStanding[];
  recentMatches: MatchFeedItem[];
};

export type MatchesData = {
  selectedPlayerName: string | null;
  matches: MatchFeedItem[];
};

export type MatchDetailData = {
  match: ResolvedGame;
};

export type StatsData = {
  summary: PlayerStatsSummary | null;
  metrics: PlayerDashboardMetrics | null;
  leaderboard: PlayerStanding[];
};
