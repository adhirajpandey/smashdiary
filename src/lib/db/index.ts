import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }
  return url;
}

type DatabaseCache = {
  client?: ReturnType<typeof postgres>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

const globalCache = globalThis as typeof globalThis & { __smashDiaryDb?: DatabaseCache };
const cache = globalCache.__smashDiaryDb ?? {};

if (!cache.client) {
  cache.client = postgres(getDatabaseUrl(), { prepare: false });
}

if (!cache.db) {
  cache.db = drizzle(cache.client, { schema });
}

globalCache.__smashDiaryDb = cache;

export const sqlClient = cache.client;
export const db = cache.db;
export { schema };
