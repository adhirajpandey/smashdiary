import { getMatchByIdQuery } from "@/lib/queries/matches";
import { buildMatchesData, getMatchesAndPlayers } from "@/lib/services/shared";
import type { MatchDetailData, MatchesData } from "@/lib/view-models";

export async function getMatchesData(playerId?: number | null): Promise<MatchesData> {
  const { matches, players } = await getMatchesAndPlayers();
  return buildMatchesData(matches, players, playerId);
}

export async function getMatchDetailData(id: number): Promise<MatchDetailData | null> {
  const match = await getMatchByIdQuery(id);
  return match ? { match } : null;
}
