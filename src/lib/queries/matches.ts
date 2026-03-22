import { getMatchRepository } from "@/lib/repositories";

export async function listMatchesQuery() {
  return getMatchRepository().listMatches();
}

export async function getMatchByIdQuery(id: number) {
  return getMatchRepository().getMatchById(id);
}
