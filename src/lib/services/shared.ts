import { getDashboardMetrics, getMatchPerspective, getPlayerMatches, getPlayerStatsSummary, getTopPerformers } from "@/lib/match-selectors";
import { listMatchesQuery } from "@/lib/queries/matches";
import { listPlayersQuery } from "@/lib/queries/players";
import type { Player, ResolvedGame } from "@/lib/types";
import type { MatchFeedItem } from "@/lib/view-models";

export async function getMatchesAndPlayers() {
  const [matches, players] = await Promise.all([listMatchesQuery(), listPlayersQuery()]);
  return { matches, players };
}

export function getSelectedPlayer(players: Player[], playerId?: number | null) {
  if (!playerId) {
    return null;
  }

  return players.find((player) => player.id === playerId) ?? null;
}

export function buildMatchFeedItems(matches: ResolvedGame[], playerId?: number | null): MatchFeedItem[] {
  return matches.map((match) => {
    const perspective = getMatchPerspective(match, playerId);
    const result = perspective.result === "Victory" || perspective.result === "Defeat" ? perspective.result : null;

    return {
      id: match.id,
      playedOn: match.playedOn,
      slot: match.slot,
      format: match.format,
      result,
      ownSideNames: perspective.ownSide.map((player) => player.name),
      opposingSideNames: perspective.opposingSide.map((player) => player.name),
      scoreFor: perspective.score.scoreFor,
      scoreAgainst: perspective.score.scoreAgainst,
    };
  });
}

export function buildDashboardData(matches: ResolvedGame[], players: Player[], playerId?: number | null) {
  const metrics = playerId ? getDashboardMetrics(matches, players, playerId) : null;

  return {
    metrics,
    leaderboard: getTopPerformers(matches, players),
    recentMatches: metrics ? buildMatchFeedItems(metrics.recentMatches, playerId) : [],
  };
}

export function buildMatchesData(matches: ResolvedGame[], players: Player[], playerId?: number | null) {
  const selectedPlayer = getSelectedPlayer(players, playerId);
  const playerMatches = selectedPlayer ? getPlayerMatches(matches, selectedPlayer.id) : [];

  return {
    selectedPlayerName: selectedPlayer?.name ?? null,
    matches: buildMatchFeedItems(playerMatches, selectedPlayer?.id ?? null),
  };
}

export function buildStatsData(matches: ResolvedGame[], players: Player[], playerId?: number | null) {
  return {
    summary: playerId ? getPlayerStatsSummary(matches, players, playerId) : null,
    metrics: playerId ? getDashboardMetrics(matches, players, playerId) : null,
    leaderboard: getTopPerformers(matches, players),
  };
}
