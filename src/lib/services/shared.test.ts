import { buildDashboardData, buildMatchesData, buildStatsData } from "@/lib/services/shared";
import type { Player, ResolvedGame } from "@/lib/types";

const players: Player[] = [
  { id: 1, name: "Aman", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 2, name: "Riya", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
  { id: 3, name: "Kabir", createdAt: "2026-03-01T09:00:00.000Z", updatedAt: "2026-03-01T09:00:00.000Z" },
];

const matches: ResolvedGame[] = [
  {
    id: 2,
    playedAt: "2026-03-20T18:00:00.000Z",
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
    playedAt: "2026-03-19T18:30:00.000Z",
    format: "doubles",
    sideAScore: 18,
    sideBScore: 21,
    winnerSide: "B",
    createdAt: "2026-03-19T18:30:00.000Z",
    updatedAt: "2026-03-19T18:30:00.000Z",
    sideAPlayers: [players[0], players[2]],
    sideBPlayers: [players[1]],
  },
];

describe("shared screen data services", () => {
  it("builds dashboard data with feed items for the selected player", () => {
    const dashboard = buildDashboardData(matches, players, 1);

    expect(dashboard.metrics?.playerId).toBe(1);
    expect(dashboard.recentMatches[0]).toMatchObject({
      id: 2,
      result: "Victory",
      scoreFor: 22,
      scoreAgainst: 20,
    });
    expect(dashboard.leaderboard).toHaveLength(3);
  });

  it("builds selected-player match history view data", () => {
    const history = buildMatchesData(matches, players, 1);

    expect(history.selectedPlayerName).toBe("Aman");
    expect(history.matches).toHaveLength(2);
    expect(history.matches[1]).toMatchObject({
      result: "Defeat",
      scoreFor: 18,
      scoreAgainst: 21,
    });
  });

  it("builds stats data for the selected player", () => {
    const stats = buildStatsData(matches, players, 1);

    expect(stats.summary).toMatchObject({
      playerName: "Aman",
      wins: 1,
      losses: 1,
    });
    expect(stats.metrics?.playerRating).toBeGreaterThanOrEqual(0);
    expect(stats.leaderboard).toHaveLength(3);
  });
});
