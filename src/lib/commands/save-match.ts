import type { SaveMatchInput } from "@/lib/repositories/types";
import { getMatchRepository } from "@/lib/repositories";

export async function saveMatch(input: SaveMatchInput) {
  return getMatchRepository().saveMatch(input);
}
