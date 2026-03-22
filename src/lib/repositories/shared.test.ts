import { buildParticipantValues, resolveMatches, sortPlayers } from "@/lib/repositories/shared";
import type { Player } from "@/lib/types";

describe("repository shared helpers", () => {
  it("sorts players with Sagar first, then alphabetically", () => {
    const players: Player[] = [
      { id: 1, name: "Kabir", createdAt: "", updatedAt: "" },
      { id: 2, name: "sagar", createdAt: "", updatedAt: "" },
      { id: 3, name: "Aman", createdAt: "", updatedAt: "" },
    ];

    expect(sortPlayers(players).map((player) => player.name)).toEqual(["sagar", "Aman", "Kabir"]);
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
        participantId: 1,
        side: "A",
        slot: 1,
        playerId: 100,
        playerName: "Aman",
        playerCreatedAt: "2026-03-20T10:00:00.000Z",
        playerUpdatedAt: "2026-03-20T10:00:00.000Z",
      },
      {
        gameId: 12,
        playedAt: "2026-03-20T10:00:00.000Z",
        format: "doubles",
        sideAScore: 21,
        sideBScore: 18,
        winnerSide: "A",
        gameCreatedAt: "2026-03-20T10:00:00.000Z",
        gameUpdatedAt: "2026-03-20T10:00:00.000Z",
        participantId: 2,
        side: "B",
        slot: 1,
        playerId: 101,
        playerName: "Riya",
        playerCreatedAt: "2026-03-20T10:00:00.000Z",
        playerUpdatedAt: "2026-03-20T10:00:00.000Z",
      },
    ]);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.sideAPlayers.map((player) => player.name)).toEqual(["Aman"]);
    expect(matches[0]?.sideBPlayers.map((player) => player.name)).toEqual(["Riya"]);
  });

  it("builds participant rows with stable side and slot ordering", () => {
    expect(buildParticipantValues(5, [11, 12], [21], "2026-03-20T10:00:00.000Z")).toEqual([
      { gameId: 5, playerId: 11, side: "A", slot: 1, createdAt: "2026-03-20T10:00:00.000Z" },
      { gameId: 5, playerId: 12, side: "A", slot: 2, createdAt: "2026-03-20T10:00:00.000Z" },
      { gameId: 5, playerId: 21, side: "B", slot: 1, createdAt: "2026-03-20T10:00:00.000Z" },
    ]);
  });
});
