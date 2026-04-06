import {
  didPlayerWin,
  getDashboardMetrics,
  getDoublesLeaderboard,
  getLeaderboard,
  getPlayerGames,
  getPlayerPerspectiveScore,
  getPlayerSide,
  getPlayerStatsSummary,
  getSinglesLeaderboard,
} from "@/lib/diary-metrics";
import type { Player, ResolvedGame } from "@/lib/types";

const players: Player[] = [
  { id: 1, name: "Aman", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 2, name: "Riya", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 3, name: "Kabir", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 4, name: "Neha", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 5, name: "Tara", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 6, name: "Zoya", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
];

function createResolvedMatch(
  id: number,
  playedOn: string,
  format: "singles" | "doubles",
  winnerSide: "A" | "B",
  sideAPlayerIds: number[],
  sideBPlayerIds: number[],
) {
  return {
    id,
    playedOn,
    slot: "6 PM",
    format,
    sideAScore: winnerSide === "A" ? 21 : 17,
    sideBScore: winnerSide === "B" ? 21 : 17,
    winnerSide,
    createdAt: `${playedOn}T18:00:00.000Z`,
    updatedAt: `${playedOn}T18:00:00.000Z`,
    sideAPlayers: sideAPlayerIds.map((playerId) => players.find((player) => player.id === playerId)!),
    sideBPlayers: sideBPlayerIds.map((playerId) => players.find((player) => player.id === playerId)!),
  } satisfies ResolvedGame;
}

const games: ResolvedGame[] = [
  createResolvedMatch(1, "2026-03-17", "singles", "A", [1], [2]),
  createResolvedMatch(2, "2026-03-18", "singles", "A", [1], [2]),
  createResolvedMatch(3, "2026-03-19", "singles", "A", [3], [1]),
  createResolvedMatch(4, "2026-03-20", "singles", "A", [3], [1]),
  createResolvedMatch(5, "2026-03-21", "singles", "A", [3], [2]),
  createResolvedMatch(6, "2026-03-22", "singles", "B", [3], [2]),
  createResolvedMatch(7, "2026-03-24", "doubles", "A", [1, 2], [3, 4]),
  createResolvedMatch(8, "2026-03-25", "doubles", "A", [3, 4], [2, 1]),
  createResolvedMatch(9, "2026-03-26", "doubles", "A", [1, 2], [4, 3]),
];

describe("diary metrics", () => {
  it("resolves player side correctly", () => {
    expect(getPlayerSide(games[6], 1)).toBe("A");
    expect(getPlayerSide(games[6], 3)).toBe("B");
    expect(getPlayerSide(games[6], 999)).toBeNull();
  });

  it("computes winner from player perspective", () => {
    expect(didPlayerWin(games[0], 1)).toBe(true);
    expect(didPlayerWin(games[0], 2)).toBe(false);
  });

  it("computes perspective score by side", () => {
    expect(getPlayerPerspectiveScore(games[6], 1)).toEqual({ scoreFor: 21, scoreAgainst: 17 });
    expect(getPlayerPerspectiveScore(games[6], 3)).toEqual({ scoreFor: 17, scoreAgainst: 21 });
  });

  it("returns only games containing a player", () => {
    expect(getPlayerGames(games, 4)).toHaveLength(3);
    expect(getPlayerGames(games, 1)).toHaveLength(7);
  });

  it("builds player stats summary", () => {
    const summary = getPlayerStatsSummary(games, players, 1, "doubles");
    expect(summary).not.toBeNull();
    expect(summary).toMatchObject({
      totalMatches: 3,
      wins: 2,
      losses: 1,
      format: "doubles",
    });
  });

  it("returns null stats summary for unknown player", () => {
    expect(getPlayerStatsSummary(games, players, 999, "singles")).toBeNull();
  });

  it("builds dashboard metrics with score bounds and recent matches", () => {
    const metrics = getDashboardMetrics(games, players, 1, "singles");
    expect(metrics).not.toBeNull();
    expect(metrics?.wins).toBe(2);
    expect(metrics?.losses).toBe(2);
    expect(metrics?.averagePointDiff).toBe(0);
    expect(metrics?.winScore).toBeLessThanOrEqual(10);
    expect(metrics?.playerRating).toBeLessThanOrEqual(10);
    expect(metrics?.recentMatches).toHaveLength(4);
  });

  it("builds format-specific backend leaderboards", () => {
    const singlesLeaderboard = getLeaderboard(games, players, "singles");
    const doublesLeaderboard = getLeaderboard(games, players, "doubles");

    expect(getSinglesLeaderboard(games, players)[0]?.names).toEqual(["Kabir"]);
    expect(getDoublesLeaderboard(games, players)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ names: ["Aman", "Riya"] }),
        expect.objectContaining({ names: ["Kabir", "Neha"] }),
      ]),
    );
    expect(singlesLeaderboard).toMatchObject({
      title: "Singles leaderboard",
      scoreLabel: "Leaderboard score",
      minimumMatches: 3,
    });
    expect(doublesLeaderboard.entries[0]!.rawRankScore).toBeGreaterThan(doublesLeaderboard.entries[1]!.rawRankScore);
  });
});
