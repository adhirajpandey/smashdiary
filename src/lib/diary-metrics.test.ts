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
  { id: "p1", name: "Aman", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: "p2", name: "Riya", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: "p3", name: "Kabir", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: "p4", name: "Neha", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
];

const games: ResolvedGame[] = [
  {
    id: "g3",
    playedAt: "2026-03-20T19:30:00.000Z",
    format: "doubles",
    sideAPlayerIds: ["p1", "p3"],
    sideBPlayerIds: ["p2", "p4"],
    sideAScore: 18,
    sideBScore: 21,
    winnerSide: "B",
    createdAt: "2026-03-20T19:30:00.000Z",
    updatedAt: "2026-03-20T19:30:00.000Z",
    sideAPlayers: [players[0], players[2]],
    sideBPlayers: [players[1], players[3]],
  },
  {
    id: "g2",
    playedAt: "2026-03-20T18:00:00.000Z",
    format: "singles",
    sideAPlayerIds: ["p1"],
    sideBPlayerIds: ["p2"],
    sideAScore: 22,
    sideBScore: 20,
    winnerSide: "A",
    createdAt: "2026-03-20T18:00:00.000Z",
    updatedAt: "2026-03-20T18:00:00.000Z",
    sideAPlayers: [players[0]],
    sideBPlayers: [players[1]],
  },
  {
    id: "g1",
    playedAt: "2026-03-19T18:30:00.000Z",
    format: "singles",
    sideAPlayerIds: ["p1"],
    sideBPlayerIds: ["p2"],
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
    expect(getPlayerSide(games[0], "p1")).toBe("A");
    expect(getPlayerSide(games[0], "p2")).toBe("B");
    expect(getPlayerSide(games[0], "missing")).toBeNull();
  });

  it("computes winner from player perspective", () => {
    expect(didPlayerWin(games[1], "p1")).toBe(true);
    expect(didPlayerWin(games[1], "p2")).toBe(false);
  });

  it("computes perspective score by side", () => {
    expect(getPlayerPerspectiveScore(games[0], "p1")).toEqual({ scoreFor: 18, scoreAgainst: 21 });
    expect(getPlayerPerspectiveScore(games[0], "p2")).toEqual({ scoreFor: 21, scoreAgainst: 18 });
  });

  it("returns only games containing a player", () => {
    expect(getPlayerGames(games, "p3")).toHaveLength(1);
    expect(getPlayerGames(games, "p1")).toHaveLength(3);
  });

  it("builds player stats summary", () => {
    const summary = getPlayerStatsSummary(games, players, "p1");
    expect(summary).not.toBeNull();
    expect(summary).toMatchObject({
      totalMatches: 3,
      wins: 2,
      losses: 1,
      singlesGames: 2,
      doublesGames: 1,
      recentForm: ["L", "W", "W"],
    });
  });

  it("returns null stats summary for unknown player", () => {
    expect(getPlayerStatsSummary(games, players, "missing")).toBeNull();
  });

  it("builds dashboard metrics with score bounds and recent matches", () => {
    const metrics = getDashboardMetrics(games, players, "p1");
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
    expect(standings[0]?.playerId).toBe("p1");
  });
});
