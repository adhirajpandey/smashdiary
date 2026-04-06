import { deriveWinnerSide, gameFormSchema } from "@/lib/validation";
import { getCurrentInputDateValue } from "@/lib/utils";

function addDaysToDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function validSinglesInput() {
  return {
    playedOn: "2026-03-21",
    slot: "10 AM",
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
      playedOn: "2026-03-21",
      slot: "10 AM",
      format: "doubles",
      sideAScore: 22,
      sideBScore: 20,
      sideAPlayers: ["Aman", "Kabir"],
      sideBPlayers: ["Riya", "Neha"],
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts today's date", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      playedOn: getCurrentInputDateValue(),
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects future dates", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      playedOn: addDaysToDate(getCurrentInputDateValue(), 1),
    });

    expect(parsed.success).toBe(false);
    expect(parsed.error?.flatten().fieldErrors.playedOn).toContain("Match date cannot be in the future.");
  });

  it("accepts a 30-29 finish", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      sideAScore: 30,
      sideBScore: 29,
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

  it("rejects one-point leads in extended games", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      sideAScore: 22,
      sideBScore: 21,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects 30-point finishes unless the score is 30-29", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      sideAScore: 30,
      sideBScore: 20,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects the same player on both sides", () => {
    const parsed = gameFormSchema.safeParse({
      ...validSinglesInput(),
      sideBPlayers: ["Aman"],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects duplicate players on the same side", () => {
    const parsed = gameFormSchema.safeParse({
      playedOn: "2026-03-21",
      slot: "10 AM",
      format: "doubles",
      sideAScore: 22,
      sideBScore: 20,
      sideAPlayers: ["Aman", "aman"],
      sideBPlayers: ["Riya", "Neha"],
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
