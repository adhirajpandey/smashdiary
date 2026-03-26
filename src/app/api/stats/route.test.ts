jest.mock("@/lib/services/stats", () => ({
  getStatsData: jest.fn(),
}));

import { GET } from "@/app/api/stats/route";
import { getStatsData } from "@/lib/services/stats";

describe("GET /api/stats", () => {
  it("passes playerId query params to the stats service", async () => {
    (getStatsData as jest.Mock).mockResolvedValue({
      summary: null,
      metrics: null,
      leaderboard: [],
    });

    const response = await GET(new Request("http://localhost/api/stats?playerId=3"));

    expect(getStatsData).toHaveBeenCalledWith(3);
    expect(response.status).toBe(200);
  });
});
