import type { PlayersData } from "@/lib/view-models";
import { listPlayersQuery } from "@/lib/queries/players";

export async function getPlayersData(): Promise<PlayersData> {
  return {
    players: await listPlayersQuery(),
  };
}
