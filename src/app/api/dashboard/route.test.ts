jest.mock("@/lib/logger", () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/services/dashboard", () => ({
  getDashboardData: jest.fn(),
}));

import { GET } from "@/app/api/dashboard/route";
import { getDashboardData } from "@/lib/services/dashboard";
import { logger } from "@/lib/logger";

describe("GET /api/dashboard", () => {
  it("passes playerId query params to the dashboard service", async () => {
    (getDashboardData as jest.Mock).mockResolvedValue({
      format: "singles",
      metrics: null,
      leaderboard: {
        title: "Singles leaderboard",
        scoreLabel: "Leaderboard score",
        scoreHelpText: "Help copy",
        minimumMatches: 3,
        entries: [],
      },
      recentMatches: [],
    });

    const response = await GET(new Request("http://localhost/api/dashboard?playerId=7&format=doubles"));

    expect(getDashboardData).toHaveBeenCalledWith(7, "doubles");
    expect(response.status).toBe(200);
  });

  it("logs and returns a server error when the service throws", async () => {
    const error = new Error("db down");
    (getDashboardData as jest.Mock).mockRejectedValue(error);

    const response = await GET(new Request("http://localhost/api/dashboard?playerId=7"));

    expect(response.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith("api", "route_error", { route: "GET /api/dashboard", error });
  });
});
