import { buildMatchReaction } from "@/lib/reaction-text";
import type { Player, ResolvedGame } from "@/lib/types";

const PLAYER_A: Player = {
  id: 1,
  name: "Sanidhya",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const PLAYER_B: Player = {
  id: 2,
  name: "Amar",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const GAME: ResolvedGame = {
  id: 123,
  playedAt: "2026-01-01T00:00:00.000Z",
  format: "singles",
  sideAScore: 21,
  sideBScore: 18,
  winnerSide: "A",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  sideAPlayers: [PLAYER_A],
  sideBPlayers: [PLAYER_B],
};

describe("buildMatchReaction", () => {
  it("is deterministic for the same input", () => {
    const first = buildMatchReaction(GAME, PLAYER_A.id);
    const second = buildMatchReaction(GAME, PLAYER_A.id);
    expect(first).toEqual(second);
  });

  it("returns win tone when selected player won", () => {
    const reaction = buildMatchReaction(GAME, PLAYER_A.id);
    expect(reaction.tone).toBe("win");
  });

  it("returns loss tone when selected player lost", () => {
    const reaction = buildMatchReaction(GAME, PLAYER_B.id);
    expect(reaction.tone).toBe("loss");
  });

  it("falls back to neutral without selected identity", () => {
    const reaction = buildMatchReaction(GAME, null);
    expect(reaction.tone).toBe("neutral");
  });

  it("keeps tone language safe", () => {
    const reaction = buildMatchReaction(GAME, PLAYER_B.id);
    expect(reaction.text.toLowerCase()).not.toMatch(/idiot|stupid|trash|loser|worthless|hate/);
  });
});

