jest.mock("@/lib/commands/save-match", () => ({
  saveMatch: jest.fn(),
}));

import { saveMatch } from "@/lib/commands/save-match";
import { MatchNotFoundError } from "@/lib/match-errors";
import { saveMatchFromJson } from "@/lib/services/save-match";

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
  });

  it("returns an internal error when saving throws unexpectedly", async () => {
    (saveMatch as jest.Mock).mockRejectedValue(new Error("db down"));

    await expect(saveMatchFromJson(payload)).resolves.toEqual({
      type: "internal_error",
      message: "Could not save match. Please try again.",
    });
  });
});
