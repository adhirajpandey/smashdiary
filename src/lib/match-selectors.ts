import type { Player, PlayerDashboardMetrics, PlayerStanding, PlayerStatsSummary, ResolvedGame } from "@/lib/types";

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

export function getPlayerSummary(
  matches: ResolvedGame[],
  players: Player[],
  playerId: number,
): PlayerStatsSummary | null {
  const player = players.find((entry) => entry.id === playerId);
  if (!player) {
    return null;
  }

  const playerMatches = getPlayerMatches(matches, playerId);
  const wins = playerMatches.filter((match) => didPlayerWin(match, playerId)).length;
  const losses = playerMatches.length - wins;

  return {
    playerId: player.id,
    playerName: player.name,
    totalMatches: playerMatches.length,
    wins,
    losses,
    recentForm: playerMatches.slice(0, 6).map((match) => (didPlayerWin(match, playerId) ? "W" : "L")),
    singlesGames: playerMatches.filter((match) => match.format === "singles").length,
    doublesGames: playerMatches.filter((match) => match.format === "doubles").length,
  };
}

export const getPlayerStatsSummary = getPlayerSummary;

export function getPlayerRating(matches: ResolvedGame[], playerId: number) {
  const playerMatches = getPlayerMatches(matches, playerId);
  const wins = playerMatches.filter((match) => didPlayerWin(match, playerId)).length;
  const pointDiff = playerMatches.reduce((sum, match) => {
    const { scoreFor, scoreAgainst } = getPlayerPerspectiveScore(match, playerId);
    return sum + (scoreFor - scoreAgainst);
  }, 0);
  const averageDiff = playerMatches.length ? pointDiff / playerMatches.length : 0;
  const winRate = playerMatches.length ? wins / playerMatches.length : 0;

  return Number(Math.min(10, winRate * 10 + Math.max(averageDiff, 0) * 0.5).toFixed(1));
}

export function getDashboardMetrics(
  matches: ResolvedGame[],
  players: Player[],
  playerId: number,
): PlayerDashboardMetrics | null {
  const stats = getPlayerSummary(matches, players, playerId);
  if (!stats) {
    return null;
  }

  const playerMatches = getPlayerMatches(matches, playerId);
  const winRate = playerMatches.length ? stats.wins / playerMatches.length : 0;

  return {
    playerId: stats.playerId,
    playerName: stats.playerName,
    winScore: Number((winRate * 10).toFixed(1)),
    playerRating: getPlayerRating(matches, playerId),
    wins: stats.wins,
    losses: stats.losses,
    singlesGames: stats.singlesGames,
    doublesGames: stats.doublesGames,
    recentMatches: playerMatches.slice(0, 4),
  };
}

export function getTopPerformers(matches: ResolvedGame[], players: Player[]): PlayerStanding[] {
  return players
    .map((player) => {
      const playerMatches = getPlayerMatches(matches, player.id);
      const wins = playerMatches.filter((match) => didPlayerWin(match, player.id)).length;

      return {
        playerId: player.id,
        playerName: player.name,
        wins,
        rating: getPlayerRating(matches, player.id),
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      return b.rating - a.rating;
    })
    .slice(0, 3);
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
