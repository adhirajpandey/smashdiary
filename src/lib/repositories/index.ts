import { postgresMatchRepository } from "@/lib/repositories/postgres-match-repository";

export function getMatchRepository() {
  return postgresMatchRepository;
}
