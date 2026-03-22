import { isTestMode } from "@/lib/runtime-mode";
import { postgresMatchRepository } from "@/lib/repositories/postgres-match-repository";
import { sqliteMatchRepository } from "@/lib/repositories/sqlite-match-repository";

export function getMatchRepository() {
  return isTestMode() ? sqliteMatchRepository : postgresMatchRepository;
}
