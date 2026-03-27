import { buildGameFormSeed } from "@/lib/game-form-seed";
import type { ResolvedGame } from "@/lib/types";

const match: ResolvedGame = {
  id: 12,
  playedAt: "2026-03-22 12:00:00",
  format: "doubles",
  sideAScore: 21,
  sideBScore: 19,
  winnerSide: "A",
  createdAt: "2026-03-22 12:00:00",
  updatedAt: "2026-03-22 12:00:00",
  sideAPlayers: [
    { id: 1, name: "Adhiraj", createdAt: "2026-03-22 12:00:00", updatedAt: "2026-03-22 12:00:00" },
    { id: 2, name: "Aman", createdAt: "2026-03-22 12:00:00", updatedAt: "2026-03-22 12:00:00" },
  ],
  sideBPlayers: [
    { id: 3, name: "Riya", createdAt: "2026-03-22 12:00:00", updatedAt: "2026-03-22 12:00:00" },
    { id: 4, name: "Sara", createdAt: "2026-03-22 12:00:00", updatedAt: "2026-03-22 12:00:00" },
  ],
};

describe("buildGameFormSeed", () => {
  it("rotates a selected side A slot 2 player into the primary slot", () => {
    expect(buildGameFormSeed(match, 2)).toEqual({
      format: "doubles",
      playedAt: "2026-03-22 12:00:00",
      sideAScore: 21,
      sideBScore: 19,
      sideAPlayers: ["Aman", "Adhiraj"],
      sideBPlayers: ["Riya", "Sara"],
      mode: "personalized",
    });
  });

  it("swaps sides and scores when the selected player is on side B slot 2", () => {
    expect(buildGameFormSeed(match, 4)).toEqual({
      format: "doubles",
      playedAt: "2026-03-22 12:00:00",
      sideAScore: 19,
      sideBScore: 21,
      sideAPlayers: ["Sara", "Riya"],
      sideBPlayers: ["Adhiraj", "Aman"],
      mode: "personalized",
    });
  });

  it("returns a neutral seed when the selected player is missing or unset", () => {
    expect(buildGameFormSeed(match, 99)).toEqual({
      format: "doubles",
      playedAt: "2026-03-22 12:00:00",
      sideAScore: 21,
      sideBScore: 19,
      sideAPlayers: ["Adhiraj", "Aman"],
      sideBPlayers: ["Riya", "Sara"],
      mode: "neutral",
    });
    expect(buildGameFormSeed(match, null)).toEqual({
      format: "doubles",
      playedAt: "2026-03-22 12:00:00",
      sideAScore: 21,
      sideBScore: 19,
      sideAPlayers: ["Adhiraj", "Aman"],
      sideBPlayers: ["Riya", "Sara"],
      mode: "neutral",
    });
  });
});
