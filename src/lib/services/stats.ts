import { buildStatsData, getMatchesAndPlayers } from "@/lib/services/shared";
import type { StatsFormat } from "@/lib/types";
import type { StatsData } from "@/lib/view-models";

export async function getStatsData(playerId: number | null | undefined, format: StatsFormat): Promise<StatsData> {
  const { matches, players } = await getMatchesAndPlayers();
  return buildStatsData(matches, players, playerId, format);
}
