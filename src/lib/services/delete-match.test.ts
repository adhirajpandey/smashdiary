jest.mock("@/lib/commands/delete-match", () => ({
  deleteMatch: jest.fn(),
}));

import { deleteMatch } from "@/lib/commands/delete-match";
import { deleteMatchById } from "@/lib/services/delete-match";

describe("deleteMatchById", () => {
  it("returns the command result", async () => {
    (deleteMatch as jest.Mock).mockResolvedValue(false);

    await expect(deleteMatchById(42)).resolves.toBe(false);
    expect(deleteMatch).toHaveBeenCalledWith(42);
  });
});
