jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/services/players", () => ({
  getPlayersData: jest.fn(),
}));

import { GET } from "@/app/api/players/route";
import { getPlayersData } from "@/lib/services/players";
import { logger } from "@/lib/logger";

describe("GET /api/players", () => {
  it("returns players JSON", async () => {
    (getPlayersData as jest.Mock).mockResolvedValue({
      players: [{ id: 1, name: "Aman", createdAt: "a", updatedAt: "a" }],
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        players: [{ id: 1, name: "Aman", createdAt: "a", updatedAt: "a" }],
      },
    });
  });

  it("logs and returns a server error when the service throws", async () => {
    const error = new Error("db down");
    (getPlayersData as jest.Mock).mockRejectedValue(error);

    const response = await GET();

    expect(response.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith("api", "route_error", { route: "GET /api/players", error });
  });
});
