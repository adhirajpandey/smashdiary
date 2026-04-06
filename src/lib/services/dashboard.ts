import { buildDashboardData, getMatchesAndPlayers } from "@/lib/services/shared";
import type { StatsFormat } from "@/lib/types";
import type { DashboardData } from "@/lib/view-models";

export async function getDashboardData(playerId: number | null | undefined, format: StatsFormat): Promise<DashboardData> {
  const { matches, players } = await getMatchesAndPlayers();
  return buildDashboardData(matches, players, playerId, format);
}
