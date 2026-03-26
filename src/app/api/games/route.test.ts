jest.mock("@/lib/server/diary-service", () => ({
  listGamesService: jest.fn(),
  upsertGameService: jest.fn(),
}));

import { ApiValidationError } from "@/lib/server/errors";
import { GET, POST } from "@/app/api/games/route";
import { listGamesService, upsertGameService } from "@/lib/server/diary-service";

describe("/api/games route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes filter query params to the list service", async () => {
    (listGamesService as jest.Mock).mockResolvedValue([{ id: "g_1" }]);

    const response = await GET(new Request("http://localhost/api/games?playerId=p_1&limit=4"));

    expect(listGamesService).toHaveBeenCalledWith("p_1", 4);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([{ id: "g_1" }]);
  });

  it("returns 201 on successful creation", async () => {
    (upsertGameService as jest.Mock).mockResolvedValue({ id: "g_new" });

    const response = await POST(
      new Request("http://localhost/api/games", {
        method: "POST",
        body: JSON.stringify({
          playedAt: "2026-03-22T12:00",
          format: "singles",
          sideAScore: 21,
          sideBScore: 18,
          sideAPlayers: ["Sanidhya"],
          sideBPlayers: ["Amar"],
        }),
      }),
    );

    expect(upsertGameService).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "singles",
        sideAScore: 21,
      }),
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "g_new" });
  });

  it("maps validation errors to a 400 response", async () => {
    (upsertGameService as jest.Mock).mockRejectedValue(
      new ApiValidationError("Please fix the highlighted input and try again.", {
        sideAScore: "A final game needs one winning side.",
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/games", {
        method: "POST",
        body: JSON.stringify({
          playedAt: "2026-03-22T12:00",
          format: "singles",
          sideAScore: 12,
          sideBScore: 12,
          sideAPlayers: ["Sanidhya"],
          sideBPlayers: ["Amar"],
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Please fix the highlighted input and try again.",
      fieldErrors: {
        sideAScore: "A final game needs one winning side.",
      },
      code: "VALIDATION_ERROR",
    });
  });
});
