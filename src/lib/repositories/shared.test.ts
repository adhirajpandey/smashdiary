import { buildGamePlayerColumns, normalizePlayedAt, resolveMatches, sortPlayers } from "@/lib/repositories/shared";
import type { Player } from "@/lib/types";

describe("repository shared helpers", () => {
  it("sorts players alphabetically", () => {
    const players: Player[] = [
      { id: 1, name: "Kabir", createdAt: "", updatedAt: "" },
      { id: 2, name: "sagar", createdAt: "", updatedAt: "" },
      { id: 3, name: "Aman", createdAt: "", updatedAt: "" },
    ];

    expect(sortPlayers(players).map((player) => player.name)).toEqual(["Aman", "Kabir", "sagar"]);
  });

  it("resolves joined rows into matches with side rosters", () => {
    const matches = resolveMatches([
      {
        gameId: 12,
        playedAt: "2026-03-20T10:00:00.000Z",
        format: "doubles",
        sideAScore: 21,
        sideBScore: 18,
        winnerSide: "A",
        gameCreatedAt: "2026-03-20T10:00:00.000Z",
        gameUpdatedAt: "2026-03-20T10:00:00.000Z",
        sideAPlayer1Id: 100,
        sideAPlayer1Name: "Aman",
        sideAPlayer1CreatedAt: "2026-03-20T10:00:00.000Z",
        sideAPlayer1UpdatedAt: "2026-03-20T10:00:00.000Z",
        sideAPlayer2Id: null,
        sideAPlayer2Name: null,
        sideAPlayer2CreatedAt: null,
        sideAPlayer2UpdatedAt: null,
        sideBPlayer1Id: 101,
        sideBPlayer1Name: "Riya",
        sideBPlayer1CreatedAt: "2026-03-20T10:00:00.000Z",
        sideBPlayer1UpdatedAt: "2026-03-20T10:00:00.000Z",
        sideBPlayer2Id: null,
        sideBPlayer2Name: null,
        sideBPlayer2CreatedAt: null,
        sideBPlayer2UpdatedAt: null,
      },
    ]);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.sideAPlayers.map((player) => player.name)).toEqual(["Aman"]);
    expect(matches[0]?.sideBPlayers.map((player) => player.name)).toEqual(["Riya"]);
  });

  it("builds game player columns with stable slot ordering", () => {
    expect(buildGamePlayerColumns([11, 12], [21])).toEqual({
      sideAPlayer1Id: 11,
      sideAPlayer2Id: 12,
      sideBPlayer1Id: 21,
      sideBPlayer2Id: null,
    });
  });

  it("normalizes playedAt values to IST wall-clock storage", () => {
    expect(normalizePlayedAt("2026-03-22T22:29")).toBe("2026-03-22 22:29:00");
    expect(normalizePlayedAt("2026-03-22T22:29:00.000Z")).toBe("2026-03-22 22:29:00");
  });
});
