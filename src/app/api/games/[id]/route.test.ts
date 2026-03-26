jest.mock("@/lib/server/diary-service", () => ({
  getGameByIdService: jest.fn(),
  upsertGameService: jest.fn(),
}));

import { ApiNotFoundError } from "@/lib/server/errors";
import { GET, PUT } from "@/app/api/games/[id]/route";
import { getGameByIdService, upsertGameService } from "@/lib/server/diary-service";

describe("/api/games/[id] route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the requested game", async () => {
    (getGameByIdService as jest.Mock).mockResolvedValue({ id: "g_1" });

    const response = await GET(new Request("http://localhost/api/games/g_1"), {
      params: Promise.resolve({ id: "g_1" }),
    });

    expect(getGameByIdService).toHaveBeenCalledWith("g_1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: "g_1" });
  });

  it("returns 404 when an update target is missing", async () => {
    (upsertGameService as jest.Mock).mockRejectedValue(new ApiNotFoundError("Match record not found."));

    const response = await PUT(
      new Request("http://localhost/api/games/g_missing", {
        method: "PUT",
        body: JSON.stringify({
          playedAt: "2026-03-22T12:00",
          format: "singles",
          sideAScore: 21,
          sideBScore: 19,
          sideAPlayers: ["Sanidhya"],
          sideBPlayers: ["Amar"],
        }),
      }),
      {
        params: Promise.resolve({ id: "g_missing" }),
      },
    );

    expect(upsertGameService).toHaveBeenCalledWith(expect.any(Object), "g_missing");
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      message: "Match record not found.",
      code: "NOT_FOUND",
    });
  });
});
