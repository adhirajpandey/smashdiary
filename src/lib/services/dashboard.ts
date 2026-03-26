import { buildDashboardData, getMatchesAndPlayers } from "@/lib/services/shared";
import type { DashboardData } from "@/lib/view-models";

export async function getDashboardData(playerId?: number | null): Promise<DashboardData> {
  const { matches, players } = await getMatchesAndPlayers();
  return buildDashboardData(matches, players, playerId);
}
