jest.mock("@/lib/repositories", () => ({
  getMatchRepository: jest.fn(),
}));

import { deleteMatch } from "@/lib/commands/delete-match";
import { getMatchRepository } from "@/lib/repositories";

describe("deleteMatch", () => {
  it("delegates to the active repository", async () => {
    const deleteMatchMock = jest.fn().mockResolvedValue(true);
    (getMatchRepository as jest.Mock).mockReturnValue({ deleteMatch: deleteMatchMock });

    await expect(deleteMatch(18)).resolves.toBe(true);
    expect(deleteMatchMock).toHaveBeenCalledWith(18);
  });
});
