import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getRequiredDatabaseUrl } from "@/lib/config/env";
import * as schema from "@/lib/db/schema";

function getDatabaseUrl() {
  return getRequiredDatabaseUrl();
}

type DatabaseCache = {
  client?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

const globalCache = globalThis as typeof globalThis & { __smashDiaryDb?: DatabaseCache };
const cache = globalCache.__smashDiaryDb ?? {};

function ensureDatabase() {
  if (!cache.client) {
    cache.client = postgres(getDatabaseUrl(), { prepare: false });
  }

  if (!cache.db) {
    cache.db = drizzle(cache.client, { schema });
  }

  globalCache.__smashDiaryDb = cache;

  return cache;
}

export function getSqlClient() {
  return ensureDatabase().client!;
}

export function getDb() {
  return ensureDatabase().db!;
}

export { schema };
