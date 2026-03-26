import { getMatchByIdQuery, listMatchesQuery } from "@/lib/queries/matches";
import { listPlayersQuery } from "@/lib/queries/players";

export async function getAppShellData() {
  const players = await listPlayersQuery();
  return { players };
}

export async function getDashboardPageData() {
  const [matches, players] = await Promise.all([listMatchesQuery(), listPlayersQuery()]);
  return { matches, players };
}

export async function getMatchesPageData() {
  const [matches, players] = await Promise.all([listMatchesQuery(), listPlayersQuery()]);
  return { matches, players };
}

export async function getStatsPageData() {
  const [matches, players] = await Promise.all([listMatchesQuery(), listPlayersQuery()]);
  return { matches, players };
}

export async function getMatchFormPageData() {
  const players = await listPlayersQuery();
  return { playerSuggestions: players.map((player) => player.name) };
}

export async function getMatchDetailPageData(id: number) {
  return getMatchByIdQuery(id);
}
