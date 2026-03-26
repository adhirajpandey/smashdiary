jest.mock("@/lib/services/dashboard", () => ({
  getDashboardData: jest.fn(),
}));

import { GET } from "@/app/api/dashboard/route";
import { getDashboardData } from "@/lib/services/dashboard";

describe("GET /api/dashboard", () => {
  it("passes playerId query params to the dashboard service", async () => {
    (getDashboardData as jest.Mock).mockResolvedValue({
      metrics: null,
      leaderboard: [],
      recentMatches: [],
    });

    const response = await GET(new Request("http://localhost/api/dashboard?playerId=7"));

    expect(getDashboardData).toHaveBeenCalledWith(7);
    expect(response.status).toBe(200);
  });
});
