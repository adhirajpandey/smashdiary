import { getMatchRepository } from "@/lib/repositories";

export async function listPlayersQuery() {
  return getMatchRepository().listPlayers();
}
