jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/commands/save-match", () => ({
  saveMatch: jest.fn(),
}));

import { saveMatch } from "@/lib/commands/save-match";
import { logger } from "@/lib/logger";
import { MatchNotFoundError } from "@/lib/match-errors";
import { saveMatchFromJson } from "@/lib/services/save-match";
import { getCurrentInputDateValue } from "@/lib/utils";

function addDaysToDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe("saveMatchFromJson", () => {
  const payload = {
    playedOn: "2026-03-22",
    slot: "12 PM",
    format: "singles",
    sideAScore: 21,
    sideBScore: 18,
    sideAPlayers: ["Aman"],
    sideBPlayers: ["Riya"],
  } as const;

  it("returns validation errors when the payload is invalid", async () => {
    const result = await saveMatchFromJson({
      ...payload,
      sideAScore: 19,
    });

    expect(result).toMatchObject({
      type: "validation_error",
      errors: {
        formError: "Please fix the highlighted input and try again.",
        fieldErrors: {
          sideAScore: "The winning side must reach at least 21.",
        },
      },
    });
    expect(saveMatch).not.toHaveBeenCalled();
  });

  it("returns validation errors when the match date is in the future", async () => {
    const result = await saveMatchFromJson({
      ...payload,
      playedOn: addDaysToDate(getCurrentInputDateValue(), 1),
    });

    expect(result).toMatchObject({
      type: "validation_error",
      errors: {
        formError: "Please fix the highlighted input and try again.",
        fieldErrors: {
          playedOn: "Match date cannot be in the future.",
        },
      },
    });
    expect(saveMatch).not.toHaveBeenCalled();
  });

  it("returns the saved id on success", async () => {
    (saveMatch as jest.Mock).mockResolvedValue(55);

    await expect(saveMatchFromJson(payload)).resolves.toEqual({
      type: "success",
      id: 55,
    });
    expect(saveMatch).toHaveBeenCalledWith({
      ...payload,
      winnerSide: "A",
    });
  });

  it("returns not found when an update target does not exist", async () => {
    (saveMatch as jest.Mock).mockRejectedValue(new MatchNotFoundError());

    await expect(saveMatchFromJson(payload, 12)).resolves.toEqual({
      type: "not_found",
      message: "Match not found.",
    });
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("logs and returns an internal error when saving throws unexpectedly", async () => {
    const error = new Error("db down");
    (saveMatch as jest.Mock).mockRejectedValue(error);

    await expect(saveMatchFromJson(payload)).resolves.toEqual({
      type: "internal_error",
      message: "Could not save match. Please try again.",
    });
    expect(logger.error).toHaveBeenCalledWith("save-match", "save_failed", { id: undefined, error });
  });
});
