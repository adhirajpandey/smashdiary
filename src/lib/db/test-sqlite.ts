import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import seedData from "@/data/diary.json";
import { normalizePlayedAtValue } from "@/lib/utils";

type LegacySeedPlayer = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type LegacySeedGame = {
  id: string;
  playedAt: string;
  format: "singles" | "doubles";
  sideAPlayerIds: string[];
  sideBPlayerIds: string[];
  sideAScore: number;
  sideBScore: number;
  winnerSide: "A" | "B";
  createdAt: string;
  updatedAt: string;
};

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
  client.pragma("foreign_keys = ON");
  client.exec(`
    DROP TABLE IF EXISTS game_participants;
    DROP TABLE IF EXISTS games;
    DROP TABLE IF EXISTS players;

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS players_name_lower_idx ON players(lower(name));

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      played_at TEXT NOT NULL,
      format TEXT NOT NULL CHECK(format IN ('singles', 'doubles')),
      side_a_player_1_id INTEGER NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
      side_a_player_2_id INTEGER REFERENCES players(id) ON DELETE RESTRICT,
      side_b_player_1_id INTEGER NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
      side_b_player_2_id INTEGER REFERENCES players(id) ON DELETE RESTRICT,
      side_a_score INTEGER NOT NULL CHECK(side_a_score BETWEEN 0 AND 30),
      side_b_score INTEGER NOT NULL CHECK(side_b_score BETWEEN 0 AND 30),
      winner_side TEXT NOT NULL CHECK(winner_side IN ('A', 'B')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      CHECK(
        (format = 'singles' AND side_a_player_2_id IS NULL AND side_b_player_2_id IS NULL)
        OR (format = 'doubles' AND side_a_player_2_id IS NOT NULL AND side_b_player_2_id IS NOT NULL)
      ),
      CHECK(
        (side_a_player_2_id IS NULL OR side_a_player_1_id <> side_a_player_2_id)
        AND side_a_player_1_id <> side_b_player_1_id
        AND (side_b_player_2_id IS NULL OR side_a_player_1_id <> side_b_player_2_id)
        AND (side_a_player_2_id IS NULL OR side_a_player_2_id <> side_b_player_1_id)
        AND (side_a_player_2_id IS NULL OR side_b_player_2_id IS NULL OR side_a_player_2_id <> side_b_player_2_id)
        AND (side_b_player_2_id IS NULL OR side_b_player_1_id <> side_b_player_2_id)
      ),
      CHECK(side_a_score <> side_b_score),
      CHECK(
        (winner_side = 'A' AND side_a_score > side_b_score)
        OR (winner_side = 'B' AND side_b_score > side_a_score)
      ),
      CHECK(
        max(side_a_score, side_b_score) >= 21
        AND (
          (max(side_a_score, side_b_score) = 21 AND min(side_a_score, side_b_score) <= 19)
          OR (
            max(side_a_score, side_b_score) BETWEEN 22 AND 29
            AND max(side_a_score, side_b_score) - min(side_a_score, side_b_score) = 2
          )
          OR (max(side_a_score, side_b_score) = 30 AND min(side_a_score, side_b_score) = 29)
        )
      )
    );
  `);
}

function resetAndSeed(client: Database.Database) {
  const players = seedData.players as LegacySeedPlayer[];
  const games = seedData.games as LegacySeedGame[];
  const playerIdMap = new Map<string, number>();

  const insertPlayer = client.prepare(
    "INSERT INTO players (name, created_at, updated_at) VALUES (?, ?, ?)",
  );
  const insertGame = client.prepare(
    [
      "INSERT INTO games",
      [
        "(played_at, format, side_a_player_1_id, side_a_player_2_id,",
        "side_b_player_1_id, side_b_player_2_id, side_a_score, side_b_score,",
        "winner_side, created_at, updated_at)",
      ].join(" "),
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ].join(" "),
  );

  const runSeed = client.transaction(() => {
    client.exec("DELETE FROM games;");
    client.exec("DELETE FROM players;");
    client.exec("DELETE FROM sqlite_sequence WHERE name IN ('players', 'games');");

    for (const player of players) {
      const inserted = insertPlayer.run(
        player.name,
        player.createdAt,
        player.updatedAt,
      );
      playerIdMap.set(player.id, Number(inserted.lastInsertRowid));
    }

    for (const game of games) {
      const sideAPlayerIds = game.sideAPlayerIds.map((legacyPlayerId) => {
        const playerId = playerIdMap.get(legacyPlayerId);
        if (!playerId) {
          throw new Error(`Missing seeded player for ${legacyPlayerId}.`);
        }
        return playerId;
      });
      const sideBPlayerIds = game.sideBPlayerIds.map((legacyPlayerId) => {
        const playerId = playerIdMap.get(legacyPlayerId);
        if (!playerId) {
          throw new Error(`Missing seeded player for ${legacyPlayerId}.`);
        }
        return playerId;
      });

      insertGame.run(
        normalizePlayedAtValue(game.playedAt),
        game.format,
        sideAPlayerIds[0] ?? null,
        sideAPlayerIds[1] ?? null,
        sideBPlayerIds[0] ?? null,
        sideBPlayerIds[1] ?? null,
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
