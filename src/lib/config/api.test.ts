import { apiQueryKeyRoots, apiRoutes, queryKeys } from "@/lib/config/api";
import { appRoutes, getCloneMatchRoute, getEditMatchRoute, getMatchDetailRoute } from "@/lib/config/routes";

describe("config routes and api helpers", () => {
  it("builds canonical app routes", () => {
    expect(appRoutes.dashboard).toBe("/");
    expect(appRoutes.matches).toBe("/matches");
    expect(appRoutes.newMatch).toBe("/matches/new");
    expect(appRoutes.stats).toBe("/stats");
    expect(getMatchDetailRoute(12)).toBe("/matches/12");
    expect(getEditMatchRoute(12)).toBe("/matches/12/edit");
    expect(getCloneMatchRoute(12)).toBe("/matches/new?cloneFrom=12");
  });

  it("builds canonical api routes", () => {
    expect(apiRoutes.players).toBe("/api/players");
    expect(apiRoutes.matches).toBe("/api/matches");
    expect(apiRoutes.dashboard(null, "singles")).toBe("/api/dashboard?format=singles");
    expect(apiRoutes.dashboard(7, "doubles")).toBe("/api/dashboard?playerId=7&format=doubles");
    expect(apiRoutes.matchesList(null, "singles")).toBe("/api/matches?format=singles");
    expect(apiRoutes.matchesList(3, "doubles")).toBe("/api/matches?playerId=3&format=doubles");
    expect(apiRoutes.matchDetail(14)).toBe("/api/matches/14");
    expect(apiRoutes.stats(null, "doubles")).toBe("/api/stats?format=doubles");
    expect(apiRoutes.stats(5, "singles")).toBe("/api/stats?playerId=5&format=singles");
  });

  it("builds canonical query keys", () => {
    expect(apiQueryKeyRoots).toEqual({
      players: "players",
      dashboard: "dashboard",
      matches: "matches",
      matchDetail: "match-detail",
      stats: "stats",
    });
    expect(queryKeys.players).toEqual(["players"]);
    expect(queryKeys.dashboard(7, "singles")).toEqual(["dashboard", 7, "singles"]);
    expect(queryKeys.matches(7, "singles")).toEqual(["matches", 7, "singles"]);
    expect(queryKeys.matchDetail(42)).toEqual(["match-detail", 42]);
    expect(queryKeys.stats(7, "doubles")).toEqual(["stats", 7, "doubles"]);
  });
});
