import { deriveWinnerSide, gameFormSchema } from "@/lib/validation";

function validSinglesInput() {
  return {
    playedAt: "2026-03-21T10:00",
    format: "singles" as const,
    sideAScore: 21,
    sideBScore: 18,
    sideAPlayers: ["Aman"],
    sideBPlayers: ["Riya"],
  };
}

describe("gameFormSchema", () => {
  it("accepts a valid singles game", () => {
    const parsed = gameFormSchema.safeParse(validSinglesInput());
    expect(parsed.success).toBe(true);
  });

  it("accepts a valid doubles game", () => {
    const parsed = gameFormSchema.safeParse({
      playedAt: "2026-03-21T10:00",
      format: "doubles",
      sideAScore: 22,
      sideBScore: 20,
      sideAPlayers: ["Aman", "Kabir"],
      sideBPlayers: ["Riya", "Neha"],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects ties", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      sideAScore: 21,
      sideBScore: 21,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects games where winner score is below 21", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      sideAScore: 20,
      sideBScore: 18,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects runaway extra-point scores", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      sideAScore: 23,
      sideBScore: 18,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects 30-point finishes when opponent is below 20", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      sideAScore: 30,
      sideBScore: 19,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("deriveWinnerSide", () => {
  it("returns side A when side A has a higher score", () => {
    expect(deriveWinnerSide(21, 19)).toBe("A");
  });

  it("returns side B when side B has a higher score", () => {
    expect(deriveWinnerSide(18, 21)).toBe("B");
  });
});
