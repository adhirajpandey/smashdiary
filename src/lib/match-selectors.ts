import { leaderboardConfig } from "@/lib/config/domain";
import type { LeaderboardData, LeaderboardEntry, Player, PlayerDashboardMetrics, PlayerStatsSummary, ResolvedGame, StatsFormat } from "@/lib/types";
import { formatStatsFormatLabel, getMatchSlotOrder } from "@/lib/utils";

export function getPlayerSide(match: ResolvedGame, playerId: number) {
  if (match.sideAPlayers.some((player) => player.id === playerId)) {
    return "A";
  }

  if (match.sideBPlayers.some((player) => player.id === playerId)) {
    return "B";
  }

  return null;
}

export function didPlayerWin(match: ResolvedGame, playerId: number) {
  const side = getPlayerSide(match, playerId);
  return side ? match.winnerSide === side : false;
}

export function getPlayerPerspectiveScore(match: ResolvedGame, playerId: number) {
  const side = getPlayerSide(match, playerId);
  if (side === "A") {
    return { scoreFor: match.sideAScore, scoreAgainst: match.sideBScore };
  }

  if (side === "B") {
    return { scoreFor: match.sideBScore, scoreAgainst: match.sideAScore };
  }

  return { scoreFor: match.sideAScore, scoreAgainst: match.sideBScore };
}

export function getPlayerMatches(matches: ResolvedGame[], playerId: number) {
  return matches.filter(
    (match) =>
      match.sideAPlayers.some((player) => player.id === playerId) ||
      match.sideBPlayers.some((player) => player.id === playerId),
  );
}

export const getPlayerGames = getPlayerMatches;

export function filterMatchesByFormat(matches: ResolvedGame[], format: StatsFormat) {
  return matches.filter((match) => match.format === format);
}

export function getPlayerMatchesByFormat(matches: ResolvedGame[], playerId: number, format: StatsFormat) {
  return getPlayerMatches(filterMatchesByFormat(matches, format), playerId);
}

function sortMatchesAscending(matches: ResolvedGame[]) {
  return matches.slice().sort((left, right) => {
    const playedOnCompare = left.playedOn.localeCompare(right.playedOn);
    if (playedOnCompare !== 0) {
      return playedOnCompare;
    }

    const slotCompare = getMatchSlotOrder(left.slot) - getMatchSlotOrder(right.slot);
    if (slotCompare !== 0) {
      return slotCompare;
    }

    return left.id - right.id;
  });
}

function getExpectedScore(currentRating: number, opposingRating: number) {
  return 1 / (1 + 10 ** ((opposingRating - currentRating) / 400));
}

function updateEloRatings(ratingA: number, ratingB: number, scoreA: 0 | 1) {
  const expectedScoreA = getExpectedScore(ratingA, ratingB);
  const expectedScoreB = getExpectedScore(ratingB, ratingA);
  const scoreB = scoreA === 1 ? 0 : 1;

  return {
    nextRatingA: ratingA + leaderboardConfig.eloKFactor * (scoreA - expectedScoreA),
    nextRatingB: ratingB + leaderboardConfig.eloKFactor * (scoreB - expectedScoreB),
  };
}

export function normalizeLeaderboardScore(rawRankScore: number) {
  const normalized =
    leaderboardConfig.normalizedScore.midpointBase +
    (rawRankScore - leaderboardConfig.eloInitialRating) / leaderboardConfig.normalizedScore.ratingStep;

  return Number(
    Math.max(
      leaderboardConfig.normalizedScore.floor,
      Math.min(leaderboardConfig.normalizedScore.ceiling, normalized),
    ).toFixed(leaderboardConfig.normalizedScore.decimals),
  );
}

function compareLeaderboardEntries(left: LeaderboardEntry, right: LeaderboardEntry) {
  if (right.rawRankScore !== left.rawRankScore) {
    return right.rawRankScore - left.rawRankScore;
  }

  if (right.wins !== left.wins) {
    return right.wins - left.wins;
  }

  if (right.totalMatches !== left.totalMatches) {
    return right.totalMatches - left.totalMatches;
  }

  return left.names.join(" ").localeCompare(right.names.join(" "));
}

function createLeaderboardEntry(id: string, names: string[], wins: number, totalMatches: number, rawRankScore: number): LeaderboardEntry {
  return {
    id,
    names,
    wins,
    totalMatches,
    displayScore: normalizeLeaderboardScore(rawRankScore),
    rawRankScore: Number(rawRankScore.toFixed(2)),
  };
}

export function getPlayerSummary(
  matches: ResolvedGame[],
  players: Player[],
  playerId: number,
  format: StatsFormat,
): PlayerStatsSummary | null {
  const player = players.find((entry) => entry.id === playerId);
  if (!player) {
    return null;
  }

  const playerMatches = getPlayerMatchesByFormat(matches, playerId, format);
  if (!playerMatches.length) {
    return null;
  }

  const wins = playerMatches.filter((match) => didPlayerWin(match, playerId)).length;

  return {
    playerId: player.id,
    playerName: player.name,
    format,
    totalMatches: playerMatches.length,
    wins,
    losses: playerMatches.length - wins,
  };
}

export const getPlayerStatsSummary = getPlayerSummary;

export function getPlayerRating(matches: ResolvedGame[], playerId: number, format?: StatsFormat) {
  const sourceMatches = format ? filterMatchesByFormat(matches, format) : matches;
  const playerMatches = getPlayerMatches(sourceMatches, playerId);
  if (!playerMatches.length) {
    return null;
  }

  const wins = playerMatches.filter((match) => didPlayerWin(match, playerId)).length;
  const pointDiff = playerMatches.reduce((sum, match) => {
    const { scoreFor, scoreAgainst } = getPlayerPerspectiveScore(match, playerId);
    return sum + (scoreFor - scoreAgainst);
  }, 0);
  const averageDiff = playerMatches.length ? pointDiff / playerMatches.length : 0;
  const winRate = playerMatches.length ? wins / playerMatches.length : 0;

  return Number(Math.min(10, winRate * 10 + Math.max(averageDiff, 0) * 0.5).toFixed(1));
}

function getAveragePointDiff(matches: ResolvedGame[], playerId: number, format: StatsFormat) {
  const playerMatches = getPlayerMatchesByFormat(matches, playerId, format);
  if (!playerMatches.length) {
    return null;
  }

  const pointDiff = playerMatches.reduce((sum, match) => {
    const { scoreFor, scoreAgainst } = getPlayerPerspectiveScore(match, playerId);
    return sum + (scoreFor - scoreAgainst);
  }, 0);

  return Number((pointDiff / playerMatches.length).toFixed(1));
}

export function getDashboardMetrics(
  matches: ResolvedGame[],
  players: Player[],
  playerId: number,
  format: StatsFormat,
): PlayerDashboardMetrics | null {
  const stats = getPlayerSummary(matches, players, playerId, format);
  if (!stats) {
    return null;
  }

  const playerMatches = getPlayerMatchesByFormat(matches, playerId, format);
  const playerRating = getPlayerRating(matches, playerId, format);
  const averagePointDiff = getAveragePointDiff(matches, playerId, format);
  if (playerRating === null || averagePointDiff === null) {
    return null;
  }

  const winRate = playerMatches.length ? stats.wins / playerMatches.length : 0;

  return {
    playerId: stats.playerId,
    playerName: stats.playerName,
    format,
    totalMatches: stats.totalMatches,
    winScore: Number((winRate * 10).toFixed(1)),
    playerRating,
    averagePointDiff,
    wins: stats.wins,
    losses: stats.losses,
    recentMatches: playerMatches.slice(0, 4),
  };
}

export function getSinglesLeaderboard(matches: ResolvedGame[], players: Player[]): LeaderboardEntry[] {
  const singlesMatches = sortMatchesAscending(filterMatchesByFormat(matches, "singles"));
  const standings = new Map<number, { rating: number; wins: number; totalMatches: number }>();

  for (const match of singlesMatches) {
    const sideAPlayer = match.sideAPlayers[0];
    const sideBPlayer = match.sideBPlayers[0];

    if (!sideAPlayer || !sideBPlayer || match.sideAPlayers.length !== 1 || match.sideBPlayers.length !== 1) {
      continue;
    }

    const sideAStanding = standings.get(sideAPlayer.id) ?? {
      rating: leaderboardConfig.eloInitialRating,
      wins: 0,
      totalMatches: 0,
    };
    const sideBStanding = standings.get(sideBPlayer.id) ?? {
      rating: leaderboardConfig.eloInitialRating,
      wins: 0,
      totalMatches: 0,
    };
    const scoreA: 0 | 1 = match.winnerSide === "A" ? 1 : 0;
    const { nextRatingA, nextRatingB } = updateEloRatings(sideAStanding.rating, sideBStanding.rating, scoreA);

    standings.set(sideAPlayer.id, {
      rating: nextRatingA,
      wins: sideAStanding.wins + (scoreA === 1 ? 1 : 0),
      totalMatches: sideAStanding.totalMatches + 1,
    });
    standings.set(sideBPlayer.id, {
      rating: nextRatingB,
      wins: sideBStanding.wins + (scoreA === 0 ? 1 : 0),
      totalMatches: sideBStanding.totalMatches + 1,
    });
  }

  return players
    .flatMap((player) => {
      const standing = standings.get(player.id);
      if (!standing || standing.totalMatches < leaderboardConfig.minimumMatches.singles) {
        return [];
      }

      return [createLeaderboardEntry(`player-${player.id}`, [player.name], standing.wins, standing.totalMatches, standing.rating)];
    })
    .sort(compareLeaderboardEntries)
    .slice(0, leaderboardConfig.maxEntries);
}

function createTeamKey(playerIds: number[]) {
  return playerIds.slice().sort((left, right) => left - right).join(":");
}

export function getDoublesLeaderboard(matches: ResolvedGame[], players: Player[]): LeaderboardEntry[] {
  const doublesMatches = sortMatchesAscending(filterMatchesByFormat(matches, "doubles"));
  const playerById = new Map(players.map((player) => [player.id, player]));
  const standings = new Map<string, { rating: number; wins: number; totalMatches: number; names: string[] }>();

  for (const match of doublesMatches) {
    if (match.sideAPlayers.length !== 2 || match.sideBPlayers.length !== 2) {
      continue;
    }

    const sideATeamIds = match.sideAPlayers.map((player) => player.id).sort((left, right) => left - right);
    const sideBTeamIds = match.sideBPlayers.map((player) => player.id).sort((left, right) => left - right);
    const sideATeamKey = createTeamKey(sideATeamIds);
    const sideBTeamKey = createTeamKey(sideBTeamIds);

    const sideANames = sideATeamIds
      .map((playerId) => playerById.get(playerId)?.name)
      .filter((name): name is string => Boolean(name))
      .sort((left, right) => left.localeCompare(right));
    const sideBNames = sideBTeamIds
      .map((playerId) => playerById.get(playerId)?.name)
      .filter((name): name is string => Boolean(name))
      .sort((left, right) => left.localeCompare(right));

    if (sideANames.length !== 2 || sideBNames.length !== 2) {
      continue;
    }

    const sideAStanding = standings.get(sideATeamKey) ?? {
      rating: leaderboardConfig.eloInitialRating,
      wins: 0,
      totalMatches: 0,
      names: sideANames,
    };
    const sideBStanding = standings.get(sideBTeamKey) ?? {
      rating: leaderboardConfig.eloInitialRating,
      wins: 0,
      totalMatches: 0,
      names: sideBNames,
    };
    const scoreA: 0 | 1 = match.winnerSide === "A" ? 1 : 0;
    const { nextRatingA, nextRatingB } = updateEloRatings(sideAStanding.rating, sideBStanding.rating, scoreA);

    standings.set(sideATeamKey, {
      rating: nextRatingA,
      wins: sideAStanding.wins + (scoreA === 1 ? 1 : 0),
      totalMatches: sideAStanding.totalMatches + 1,
      names: sideANames,
    });
    standings.set(sideBTeamKey, {
      rating: nextRatingB,
      wins: sideBStanding.wins + (scoreA === 0 ? 1 : 0),
      totalMatches: sideBStanding.totalMatches + 1,
      names: sideBNames,
    });
  }

  return Array.from(standings.entries())
    .flatMap(([teamKey, standing]) => {
      if (standing.totalMatches < leaderboardConfig.minimumMatches.doubles) {
        return [];
      }

      return [createLeaderboardEntry(`team-${teamKey}`, standing.names, standing.wins, standing.totalMatches, standing.rating)];
    })
    .sort(compareLeaderboardEntries)
    .slice(0, leaderboardConfig.maxEntries);
}

function getLeaderboardScoreHelpText(format: StatsFormat) {
  if (format === "singles") {
    return `Leaderboard score is a 0-10 view of a backend Elo ranking for singles players. Only players with at least ${leaderboardConfig.minimumMatches.singles} singles matches are included. Higher means stronger proven results.`;
  }

  return `Leaderboard score is a 0-10 view of a backend Elo ranking for exact doubles pairs. Only pairs with at least ${leaderboardConfig.minimumMatches.doubles} matches together are included. Higher means stronger proven results together.`;
}

export function getLeaderboard(matches: ResolvedGame[], players: Player[], format: StatsFormat): LeaderboardData {
  const formatLabel = formatStatsFormatLabel(format);
  const entries = format === "singles" ? getSinglesLeaderboard(matches, players) : getDoublesLeaderboard(matches, players);

  return {
    title: `${formatLabel} leaderboard`,
    scoreLabel: leaderboardConfig.scoreLabel,
    scoreHelpText: getLeaderboardScoreHelpText(format),
    minimumMatches: leaderboardConfig.minimumMatches[format],
    entries,
  };
}

export function getMatchPerspective(match: ResolvedGame, playerId?: number | null) {
  if (!playerId) {
    return {
      ownSide: match.sideAPlayers,
      opposingSide: match.sideBPlayers,
      result: null,
      score: { scoreFor: match.sideAScore, scoreAgainst: match.sideBScore },
    };
  }

  const side = getPlayerSide(match, playerId);
  if (side === "B") {
    return {
      ownSide: match.sideBPlayers,
      opposingSide: match.sideAPlayers,
      result: didPlayerWin(match, playerId) ? "Victory" : "Defeat",
      score: getPlayerPerspectiveScore(match, playerId),
    };
  }

  return {
    ownSide: match.sideAPlayers,
    opposingSide: match.sideBPlayers,
    result: side ? (didPlayerWin(match, playerId) ? "Victory" : "Defeat") : null,
    score: side ? getPlayerPerspectiveScore(match, playerId) : { scoreFor: match.sideAScore, scoreAgainst: match.sideBScore },
  };
}
