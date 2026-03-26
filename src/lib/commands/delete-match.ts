import { getMatchRepository } from "@/lib/repositories";

export async function deleteMatch(id: number) {
  return getMatchRepository().deleteMatch(id);
}
