import { buildDashboardData, buildMatchesData, buildStatsData } from "@/lib/services/shared";
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

const matches: ResolvedGame[] = [
  createResolvedMatch(1, "2026-03-17", "singles", "A", [1], [2]),
  createResolvedMatch(2, "2026-03-18", "singles", "A", [1], [2]),
  createResolvedMatch(3, "2026-03-19", "singles", "A", [3], [1]),
  createResolvedMatch(4, "2026-03-20", "singles", "A", [3], [1]),
  createResolvedMatch(5, "2026-03-21", "singles", "A", [3], [2]),
  createResolvedMatch(6, "2026-03-22", "singles", "B", [3], [2]),
  createResolvedMatch(7, "2026-03-23", "singles", "A", [4], [5]),
  createResolvedMatch(8, "2026-03-24", "doubles", "A", [1, 2], [3, 4]),
  createResolvedMatch(9, "2026-03-25", "doubles", "A", [3, 4], [2, 1]),
  createResolvedMatch(10, "2026-03-26", "doubles", "A", [1, 2], [4, 3]),
  createResolvedMatch(11, "2026-03-27", "doubles", "A", [5, 6], [2, 4]),
  createResolvedMatch(12, "2026-03-28", "doubles", "A", [5, 6], [4, 2]),
].reverse();

describe("shared screen data services", () => {
  it("builds dashboard data with feed items and a ready-to-render leaderboard block", () => {
    const dashboard = buildDashboardData(matches, players, 1, "singles");

    expect(dashboard.metrics?.playerId).toBe(1);
    expect(dashboard.recentMatches).toHaveLength(4);
    expect(dashboard.recentMatches[0]).toMatchObject({
      id: 4,
      result: "Defeat",
      scoreFor: 17,
      scoreAgainst: 21,
    });
    expect(dashboard.leaderboard).toMatchObject({
      title: "Singles leaderboard",
      scoreLabel: "Leaderboard score",
      minimumMatches: 3,
    });
    expect(dashboard.leaderboard.entries[0]?.names).toEqual(["Kabir"]);
  });

  it("builds selected-player match history view data", () => {
    const history = buildMatchesData(matches, players, 1, "doubles");

    expect(history.selectedPlayerName).toBe("Aman");
    expect(history.format).toBe("doubles");
    expect(history.matches).toHaveLength(3);
    expect(history.matches[0]).toMatchObject({
      result: "Victory",
      scoreFor: 21,
      scoreAgainst: 17,
    });
  });

  it("returns an empty format-scoped history when the player has no matches in that format", () => {
    const history = buildMatchesData(matches, players, 6, "singles");

    expect(history.selectedPlayerName).toBe("Zoya");
    expect(history.format).toBe("singles");
    expect(history.matches).toHaveLength(0);
  });

  it("builds stats data with backend leaderboard metadata", () => {
    const stats = buildStatsData(matches, players, 1, "doubles");

    expect(stats.summary).toMatchObject({
      playerName: "Aman",
      wins: 2,
      losses: 1,
      format: "doubles",
    });
    expect(stats.metrics?.playerRating).toBeGreaterThanOrEqual(0);
    expect(stats.leaderboard).toMatchObject({
      title: "Doubles leaderboard",
      scoreLabel: "Leaderboard score",
      minimumMatches: 3,
    });
    expect(stats.leaderboard.entries[0]?.names).toEqual(["Aman", "Riya"]);
  });

  it("returns empty personal stats when the selected player has no matches in the active format", () => {
    const stats = buildStatsData(matches, players, 6, "singles");

    expect(stats.summary).toBeNull();
    expect(stats.metrics).toBeNull();
    expect(stats.leaderboard.entries).toHaveLength(3);
  });
});
