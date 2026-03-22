import {
  getMatchPerspective,
  getPlayerMatches,
  getPlayerRating,
  getPlayerSummary,
} from "@/lib/match-selectors";
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

describe("match selectors", () => {
  it("returns filtered player matches", () => {
    expect(getPlayerMatches(matches, 1)).toHaveLength(2);
    expect(getPlayerMatches(matches, 3)).toHaveLength(1);
  });

  it("builds player summary from shared selectors", () => {
    expect(getPlayerSummary(matches, players, 1)).toMatchObject({
      totalMatches: 2,
      wins: 1,
      losses: 1,
      singlesGames: 1,
      doublesGames: 1,
    });
  });

  it("returns a stable player rating", () => {
    expect(getPlayerRating(matches, 1)).toBeGreaterThanOrEqual(0);
    expect(getPlayerRating(matches, 1)).toBeLessThanOrEqual(10);
  });

  it("resolves match perspective for a selected player", () => {
    expect(getMatchPerspective(matches[1], 1)).toMatchObject({
      result: "Defeat",
      score: { scoreFor: 18, scoreAgainst: 21 },
    });
    expect(getMatchPerspective(matches[0], null)).toMatchObject({
      result: null,
      score: { scoreFor: 22, scoreAgainst: 20 },
    });
  });
});
