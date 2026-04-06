import type { StatsFormat } from "@/lib/types";

const API_BASE_PATH = "/api";

export const apiQueryKeyRoots = {
  players: "players",
  dashboard: "dashboard",
  matches: "matches",
  matchDetail: "match-detail",
  stats: "stats",
} as const;

export const queryKeys = {
  players: [apiQueryKeyRoots.players] as const,
  dashboard: (playerId: number | null, format: StatsFormat) =>
    [apiQueryKeyRoots.dashboard, playerId, format] as const,
  matches: (playerId: number | null, format: StatsFormat) =>
    [apiQueryKeyRoots.matches, playerId, format] as const,
  matchDetail: (matchId: number | null) => [apiQueryKeyRoots.matchDetail, matchId] as const,
  stats: (playerId: number | null, format: StatsFormat) =>
    [apiQueryKeyRoots.stats, playerId, format] as const,
};

function withQueryParams(
  path: string,
  params: Record<string, string | number | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export const apiRoutes = {
  players: `${API_BASE_PATH}/players`,
  matches: `${API_BASE_PATH}/matches`,
  dashboard(playerId: number | null, format: StatsFormat) {
    return withQueryParams(`${API_BASE_PATH}/dashboard`, { playerId, format });
  },
  matchesList(playerId: number | null, format: StatsFormat) {
    return withQueryParams(`${API_BASE_PATH}/matches`, { playerId, format });
  },
  matchDetail(matchId: number) {
    return `${API_BASE_PATH}/matches/${matchId}`;
  },
  stats(playerId: number | null, format: StatsFormat) {
    return withQueryParams(`${API_BASE_PATH}/stats`, { playerId, format });
  },
} as const;
