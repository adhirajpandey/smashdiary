import {
  filterMatchesByFormat,
  getDashboardMetrics,
  getDoublesLeaderboard,
  getLeaderboard,
  getMatchPerspective,
  getPlayerMatches,
  getPlayerRating,
  getPlayerSummary,
  getSinglesLeaderboard,
  normalizeLeaderboardScore,
} from "@/lib/match-selectors";
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
];

describe("match selectors", () => {
  it("returns filtered player matches", () => {
    expect(getPlayerMatches(matches, 1)).toHaveLength(7);
    expect(getPlayerMatches(matches, 6)).toHaveLength(2);
  });

  it("filters matches by format", () => {
    expect(filterMatchesByFormat(matches, "singles")).toHaveLength(7);
    expect(filterMatchesByFormat(matches, "doubles")).toHaveLength(5);
  });

  it("builds player summary from shared selectors", () => {
    expect(getPlayerSummary(matches, players, 1, "singles")).toMatchObject({
      totalMatches: 4,
      wins: 2,
      losses: 2,
      format: "singles",
    });
  });

  it("returns a stable player rating", () => {
    expect(getPlayerRating(matches, 1, "singles")).toBeGreaterThanOrEqual(0);
    expect(getPlayerRating(matches, 1, "singles")).toBeLessThanOrEqual(10);
  });

  it("returns null metrics for players without matches in the selected format", () => {
    expect(getPlayerSummary(matches, players, 6, "singles")).toBeNull();
    expect(getPlayerRating(matches, 6, "singles")).toBeNull();
  });

  it("adds average point differential to dashboard metrics for the active format", () => {
    expect(getDashboardMetrics(matches, players, 1, "singles")).toMatchObject({
      averagePointDiff: 0,
      wins: 2,
      losses: 2,
    });
    expect(getDashboardMetrics(matches, players, 1, "doubles")).toMatchObject({
      averagePointDiff: 1.3,
      wins: 2,
      losses: 1,
    });
  });

  it("normalizes backend Elo scores into the 0 to 10 display range", () => {
    expect(normalizeLeaderboardScore(1500)).toBe(5);
    expect(normalizeLeaderboardScore(1600)).toBe(6);
    expect(normalizeLeaderboardScore(1400)).toBe(4);
    expect(normalizeLeaderboardScore(2100)).toBe(10);
  });

  it("builds a singles leaderboard from backend Elo and excludes players below the minimum threshold", () => {
    const standings = getSinglesLeaderboard(matches, players);

    expect(standings).toHaveLength(3);
    expect(standings[0]?.names).toEqual(["Kabir"]);
    expect(standings.map((entry) => entry.names[0])).not.toContain("Neha");
    expect(standings.every((entry) => entry.totalMatches >= 3)).toBe(true);
    expect(standings[0]!.rawRankScore).toBeGreaterThan(standings[1]!.rawRankScore);
  });

  it("builds doubles leaderboard rows from exact team pairs and excludes pairs under the threshold", () => {
    const standings = getDoublesLeaderboard(matches, players);

    expect(standings).toHaveLength(2);
    expect(standings[0]).toMatchObject({
      names: ["Aman", "Riya"],
      wins: 2,
      totalMatches: 3,
    });
    expect(standings[1]).toMatchObject({
      names: ["Kabir", "Neha"],
      wins: 1,
      totalMatches: 3,
    });
    expect(standings.map((entry) => entry.names.join(" & "))).not.toContain("Tara & Zoya");
  });

  it("returns a backend-owned leaderboard block with metadata for the UI", () => {
    const leaderboard = getLeaderboard(matches, players, "doubles");

    expect(leaderboard).toMatchObject({
      title: "Doubles leaderboard",
      scoreLabel: "Leaderboard score",
      minimumMatches: 3,
    });
    expect(leaderboard.scoreHelpText).toContain("exact doubles pairs");
    expect(leaderboard.entries).toHaveLength(2);
  });

  it("resolves match perspective for a selected player", () => {
    expect(getMatchPerspective(matches[8], 1)).toMatchObject({
      result: "Defeat",
      score: { scoreFor: 17, scoreAgainst: 21 },
    });
    expect(getMatchPerspective(matches[0], null)).toMatchObject({
      result: null,
      score: { scoreFor: 21, scoreAgainst: 17 },
    });
  });
});
