import { buildCloneMatchSeed } from "@/lib/clone-match";
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

describe("buildCloneMatchSeed", () => {
  it("keeps the original side order when the selected player is on side A", () => {
    expect(buildCloneMatchSeed(match, 1)).toEqual({
      format: "doubles",
      sideAPlayers: ["Adhiraj", "Aman"],
      sideBPlayers: ["Riya", "Sara"],
    });
  });

  it("swaps sides when the selected player is on side B", () => {
    expect(buildCloneMatchSeed(match, 3)).toEqual({
      format: "doubles",
      sideAPlayers: ["Riya", "Sara"],
      sideBPlayers: ["Adhiraj", "Aman"],
    });
  });

  it("falls back to the original side order when the selected player is absent", () => {
    expect(buildCloneMatchSeed(match, 99)).toEqual({
      format: "doubles",
      sideAPlayers: ["Adhiraj", "Aman"],
      sideBPlayers: ["Riya", "Sara"],
    });
  });
});
