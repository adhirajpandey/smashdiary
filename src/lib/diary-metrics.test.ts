import {
  didPlayerWin,
  getDashboardMetrics,
  getPlayerGames,
  getPlayerPerspectiveScore,
  getPlayerSide,
  getPlayerStatsSummary,
  getTopPerformers,
} from "@/lib/diary-metrics";
import type { Player, ResolvedGame } from "@/lib/types";

const players: Player[] = [
  { id: 1, name: "Aman", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 2, name: "Riya", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 3, name: "Kabir", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 4, name: "Neha", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
];

const games: ResolvedGame[] = [
  {
    id: 3,
    playedOn: "2026-03-20",
    slot: "8 PM",
    format: "doubles",
    sideAScore: 18,
    sideBScore: 21,
    winnerSide: "B",
    createdAt: "2026-03-20T19:30:00.000Z",
    updatedAt: "2026-03-20T19:30:00.000Z",
    sideAPlayers: [players[0], players[2]],
    sideBPlayers: [players[1], players[3]],
  },
  {
    id: 2,
    playedOn: "2026-03-20",
    slot: "6 PM",
    format: "singles",
    sideAScore: 22,
    sideBScore: 20,
    winnerSide: "A",
    createdAt: "2026-03-20T18:00:00.000Z",
    updatedAt: "2026-03-20T18:00:00.000Z",
    sideAPlayers: [players[0]],
    sideBPlayers: [players[1]],
  },
  {
    id: 1,
    playedOn: "2026-03-19",
    slot: "7 PM",
    format: "singles",
    sideAScore: 21,
    sideBScore: 17,
    winnerSide: "A",
    createdAt: "2026-03-19T18:30:00.000Z",
    updatedAt: "2026-03-19T18:30:00.000Z",
    sideAPlayers: [players[0]],
    sideBPlayers: [players[1]],
  },
];

describe("diary metrics", () => {
  it("resolves player side correctly", () => {
    expect(getPlayerSide(games[0], 1)).toBe("A");
    expect(getPlayerSide(games[0], 2)).toBe("B");
    expect(getPlayerSide(games[0], 999)).toBeNull();
  });

  it("computes winner from player perspective", () => {
    expect(didPlayerWin(games[1], 1)).toBe(true);
    expect(didPlayerWin(games[1], 2)).toBe(false);
  });

  it("computes perspective score by side", () => {
    expect(getPlayerPerspectiveScore(games[0], 1)).toEqual({ scoreFor: 18, scoreAgainst: 21 });
    expect(getPlayerPerspectiveScore(games[0], 2)).toEqual({ scoreFor: 21, scoreAgainst: 18 });
  });

  it("returns only games containing a player", () => {
    expect(getPlayerGames(games, 3)).toHaveLength(1);
    expect(getPlayerGames(games, 1)).toHaveLength(3);
  });

  it("builds player stats summary", () => {
    const summary = getPlayerStatsSummary(games, players, 1);
    expect(summary).not.toBeNull();
    expect(summary).toMatchObject({
      totalMatches: 3,
      wins: 2,
      losses: 1,
      singlesGames: 2,
      doublesGames: 1,
      singlesWins: 2,
      singlesLosses: 0,
      doublesWins: 0,
      doublesLosses: 1,
    });
  });

  it("returns null stats summary for unknown player", () => {
    expect(getPlayerStatsSummary(games, players, 999)).toBeNull();
  });

  it("builds dashboard metrics with score bounds and recent matches", () => {
    const metrics = getDashboardMetrics(games, players, 1);
    expect(metrics).not.toBeNull();
    expect(metrics?.wins).toBe(2);
    expect(metrics?.losses).toBe(1);
    expect(metrics?.winScore).toBeLessThanOrEqual(10);
    expect(metrics?.playerRating).toBeLessThanOrEqual(10);
    expect(metrics?.recentMatches).toHaveLength(3);
  });

  it("ranks top performers by wins then rating and truncates to top 3", () => {
    const standings = getTopPerformers(games, players);
    expect(standings).toHaveLength(3);
    expect(standings[0]?.playerId).toBe(1);
  });
});
