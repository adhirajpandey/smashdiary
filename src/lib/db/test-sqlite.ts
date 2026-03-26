import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import seedData from "@/data/diary.json";

function getSqliteFilePath() {
  const dataDir = path.join(process.cwd(), ".gstack");
  mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "test-mode.sqlite");
}

type TestSqliteCache = {
  client?: Database.Database;
  initialized?: boolean;
};

const globalCache = globalThis as typeof globalThis & { __smashDiaryTestSqlite?: TestSqliteCache };
const cache = globalCache.__smashDiaryTestSqlite ?? {};

function ensureSchema(client: Database.Database) {
  client.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS players_name_lower_idx ON players(lower(name));

    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      played_at TEXT NOT NULL,
      format TEXT NOT NULL CHECK(format IN ('singles', 'doubles')),
      side_a_player_ids TEXT NOT NULL,
      side_b_player_ids TEXT NOT NULL,
      side_a_score INTEGER NOT NULL,
      side_b_score INTEGER NOT NULL,
      winner_side TEXT NOT NULL CHECK(winner_side IN ('A', 'B')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

function resetAndSeed(client: Database.Database) {
  const insertPlayer = client.prepare(
    "INSERT INTO players (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
  );
  const insertGame = client.prepare(
    [
      "INSERT INTO games",
      "(id, played_at, format, side_a_player_ids, side_b_player_ids, side_a_score, side_b_score, winner_side, created_at, updated_at)",
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ].join(" "),
  );

  const runSeed = client.transaction(() => {
    client.exec("DELETE FROM games;");
    client.exec("DELETE FROM players;");

    for (const player of seedData.players) {
      insertPlayer.run(player.id, player.name, player.createdAt, player.updatedAt);
    }

    for (const game of seedData.games) {
      insertGame.run(
        game.id,
        game.playedAt,
        game.format,
        JSON.stringify(game.sideAPlayerIds),
        JSON.stringify(game.sideBPlayerIds),
        game.sideAScore,
        game.sideBScore,
        game.winnerSide,
        game.createdAt,
        game.updatedAt,
      );
    }
  });

  runSeed();
}

function ensureClient() {
  if (!cache.client) {
    cache.client = new Database(getSqliteFilePath());
  }

  if (!cache.initialized) {
    ensureSchema(cache.client);
    resetAndSeed(cache.client);
    cache.initialized = true;
  }

  globalCache.__smashDiaryTestSqlite = cache;

  return cache.client;
}

export function getTestSqliteClient() {
  return ensureClient();
}
