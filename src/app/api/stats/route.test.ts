jest.mock("@/lib/services/stats", () => ({
  getStatsData: jest.fn(),
}));

import { GET } from "@/app/api/stats/route";
import { getStatsData } from "@/lib/services/stats";

describe("GET /api/stats", () => {
  it("passes playerId query params to the stats service", async () => {
    (getStatsData as jest.Mock).mockResolvedValue({
      format: "singles",
      summary: null,
      metrics: null,
      leaderboard: {
        title: "Singles leaderboard",
        scoreLabel: "Leaderboard score",
        scoreHelpText: "Help copy",
        minimumMatches: 3,
        entries: [],
      },
    });

    const response = await GET(new Request("http://localhost/api/stats?playerId=3&format=doubles"));

    expect(getStatsData).toHaveBeenCalledWith(3, "doubles");
    expect(response.status).toBe(200);
  });
});
