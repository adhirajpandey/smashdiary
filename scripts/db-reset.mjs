// Resets the local Docker Compose database: applies migrations, then replaces all rows with db/seed.sql.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// Matches docker-compose.yml. Never read DATABASE_URL here: it may point at production.
const LOCAL_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5433/smashdiary";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

execFileSync("docker", ["compose", "up", "-d", "--wait", "db"], { cwd: rootDir, stdio: "inherit" });

const client = postgres(LOCAL_DATABASE_URL, { max: 1, onnotice: () => {} });

try {
  await migrate(drizzle(client), { migrationsFolder: path.join(rootDir, "drizzle") });
  await client.unsafe(readFileSync(path.join(rootDir, "db/seed.sql"), "utf8")).simple();
  console.log("Local database reset from db/seed.sql.");
} finally {
  await client.end();
}
