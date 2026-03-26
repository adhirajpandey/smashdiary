jest.mock("@/lib/services/players", () => ({
  getPlayersData: jest.fn(),
}));

import { GET } from "@/app/api/players/route";
import { getPlayersData } from "@/lib/services/players";

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
});
