import type { Player, PlayerDashboardMetrics, PlayerStanding, PlayerStatsSummary, ResolvedGame } from "@/lib/types";

export function getPlayerSide(game: ResolvedGame, playerId: string) {
  if (game.sideAPlayers.some((player) => player.id === playerId)) {
    return "A";
  }

  if (game.sideBPlayers.some((player) => player.id === playerId)) {
    return "B";
  }

  return null;
}

export function didPlayerWin(game: ResolvedGame, playerId: string) {
  const side = getPlayerSide(game, playerId);
  return side ? game.winnerSide === side : false;
}

export function getPlayerPerspectiveScore(game: ResolvedGame, playerId: string) {
  const side = getPlayerSide(game, playerId);
  if (side === "A") {
    return { scoreFor: game.sideAScore, scoreAgainst: game.sideBScore };
  }

  if (side === "B") {
    return { scoreFor: game.sideBScore, scoreAgainst: game.sideAScore };
  }

  return { scoreFor: game.sideAScore, scoreAgainst: game.sideBScore };
}

export function getPlayerGames(games: ResolvedGame[], playerId: string) {
  return games.filter(
    (game) =>
      game.sideAPlayers.some((player) => player.id === playerId) ||
      game.sideBPlayers.some((player) => player.id === playerId),
  );
}

export function getPlayerStatsSummary(
  games: ResolvedGame[],
  players: Player[],
  playerId: string,
): PlayerStatsSummary | null {
  const player = players.find((entry) => entry.id === playerId);
  if (!player) {
    return null;
  }

  const playerGames = getPlayerGames(games, playerId);
  const wins = playerGames.filter((game) => didPlayerWin(game, playerId)).length;
  const losses = playerGames.length - wins;

  return {
    playerId: player.id,
    playerName: player.name,
    totalMatches: playerGames.length,
    wins,
    losses,
    recentForm: playerGames.slice(0, 6).map((game) => (didPlayerWin(game, playerId) ? "W" : "L")),
    singlesGames: playerGames.filter((game) => game.format === "singles").length,
    doublesGames: playerGames.filter((game) => game.format === "doubles").length,
  };
}

export function getDashboardMetrics(
  games: ResolvedGame[],
  players: Player[],
  playerId: string,
): PlayerDashboardMetrics | null {
  const stats = getPlayerStatsSummary(games, players, playerId);
  if (!stats) {
    return null;
  }
  const playerGames = getPlayerGames(games, playerId);
  const pointDiff = playerGames.reduce((sum, game) => {
    const { scoreFor, scoreAgainst } = getPlayerPerspectiveScore(game, playerId);
    return sum + (scoreFor - scoreAgainst);
  }, 0);
  const averageDiff = playerGames.length ? pointDiff / playerGames.length : 0;
  const winRate = playerGames.length ? stats.wins / playerGames.length : 0;

  return {
    playerId: stats.playerId,
    playerName: stats.playerName,
    winScore: Number((winRate * 10).toFixed(1)),
    playerRating: Number(Math.min(10, winRate * 10 + Math.max(averageDiff, 0) * 0.5).toFixed(1)),
    wins: stats.wins,
    losses: stats.losses,
    singlesGames: stats.singlesGames,
    doublesGames: stats.doublesGames,
    recentMatches: playerGames.slice(0, 4),
  };
}

export function getTopPerformers(games: ResolvedGame[], players: Player[]): PlayerStanding[] {
  return players
    .map((player) => {
      const playerGames = getPlayerGames(games, player.id);
      const wins = playerGames.filter((game) => didPlayerWin(game, player.id)).length;
      const losses = playerGames.length - wins;
      const pointDiff = playerGames.reduce((sum, game) => {
        const { scoreFor, scoreAgainst } = getPlayerPerspectiveScore(game, player.id);
        return sum + (scoreFor - scoreAgainst);
      }, 0);
      const averageDiff = playerGames.length ? pointDiff / playerGames.length : 0;
      const winRate = playerGames.length ? wins / playerGames.length : 0;

      return {
        playerId: player.id,
        playerName: player.name,
        wins,
        losses,
        rating: Number(Math.min(10, winRate * 10 + Math.max(averageDiff, 0) * 0.5).toFixed(1)),
      };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      return b.rating - a.rating;
    })
    .slice(0, 3)
    .map((standing) => ({
      playerId: standing.playerId,
      playerName: standing.playerName,
      wins: standing.wins,
      rating: standing.rating,
    }));
}
