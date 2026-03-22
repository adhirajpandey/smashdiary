import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import seedData from "@/data/diary.json";
import { normalizePlayerNameKey } from "@/lib/utils";

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
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_key TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      played_at TEXT NOT NULL,
      format TEXT NOT NULL CHECK(format IN ('singles', 'doubles')),
      side_a_score INTEGER NOT NULL CHECK(side_a_score BETWEEN 0 AND 30),
      side_b_score INTEGER NOT NULL CHECK(side_b_score BETWEEN 0 AND 30),
      winner_side TEXT NOT NULL CHECK(winner_side IN ('A', 'B')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
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

    CREATE TABLE IF NOT EXISTS game_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
      side TEXT NOT NULL CHECK(side IN ('A', 'B')),
      slot INTEGER NOT NULL CHECK(slot IN (1, 2)),
      created_at TEXT NOT NULL,
      UNIQUE(game_id, side, slot),
      UNIQUE(game_id, player_id)
    );

    CREATE TRIGGER IF NOT EXISTS game_participants_validate_insert
    AFTER INSERT ON game_participants
    BEGIN
      SELECT CASE
        WHEN (
          SELECT format FROM games WHERE id = NEW.game_id
        ) = 'singles'
        AND EXISTS (
          SELECT 1
          FROM (
            SELECT side, COUNT(*) AS player_count
            FROM game_participants
            WHERE game_id = NEW.game_id
            GROUP BY side
            HAVING player_count > 1
          )
        )
        THEN RAISE(ABORT, 'Singles games can only have one participant per side.')
      END;

      SELECT CASE
        WHEN (
          SELECT format FROM games WHERE id = NEW.game_id
        ) = 'doubles'
        AND EXISTS (
          SELECT 1
          FROM (
            SELECT side, COUNT(*) AS player_count
            FROM game_participants
            WHERE game_id = NEW.game_id
            GROUP BY side
            HAVING player_count > 2
          )
        )
        THEN RAISE(ABORT, 'Doubles games can only have two participants per side.')
      END;
    END;

    CREATE TRIGGER IF NOT EXISTS games_validate_roster_before_update
    BEFORE UPDATE OF format ON games
    BEGIN
      SELECT CASE
        WHEN NEW.format = 'singles'
        AND EXISTS (
          SELECT 1
          FROM (
            SELECT side, COUNT(*) AS player_count
            FROM game_participants
            WHERE game_id = NEW.id
            GROUP BY side
            HAVING player_count <> 1
          )
        )
        THEN RAISE(ABORT, 'Singles games must have one participant per side.')
      END;

      SELECT CASE
        WHEN NEW.format = 'doubles'
        AND EXISTS (
          SELECT 1
          FROM (
            SELECT side, COUNT(*) AS player_count
            FROM game_participants
            WHERE game_id = NEW.id
            GROUP BY side
            HAVING player_count <> 2
          )
        )
        THEN RAISE(ABORT, 'Doubles games must have two participants per side.')
      END;
    END;
  `);
}

function resetAndSeed(client: Database.Database) {
  const players = seedData.players as LegacySeedPlayer[];
  const games = seedData.games as LegacySeedGame[];
  const playerIdMap = new Map<string, number>();

  const insertPlayer = client.prepare(
    "INSERT INTO players (name, name_key, created_at, updated_at) VALUES (?, ?, ?, ?)",
  );
  const insertGame = client.prepare(
    [
      "INSERT INTO games",
      "(played_at, format, side_a_score, side_b_score, winner_side, created_at, updated_at)",
      "VALUES (?, ?, ?, ?, ?, ?, ?)",
    ].join(" "),
  );
  const insertParticipant = client.prepare(
    "INSERT INTO game_participants (game_id, player_id, side, slot, created_at) VALUES (?, ?, ?, ?, ?)",
  );

  const runSeed = client.transaction(() => {
    client.exec("DELETE FROM game_participants;");
    client.exec("DELETE FROM games;");
    client.exec("DELETE FROM players;");
    client.exec("DELETE FROM sqlite_sequence WHERE name IN ('players', 'games', 'game_participants');");

    for (const player of players) {
      const inserted = insertPlayer.run(
        player.name,
        normalizePlayerNameKey(player.name),
        player.createdAt,
        player.updatedAt,
      );
      playerIdMap.set(player.id, Number(inserted.lastInsertRowid));
    }

    for (const game of games) {
      const insertedGame = insertGame.run(
        game.playedAt,
        game.format,
        game.sideAScore,
        game.sideBScore,
        game.winnerSide,
        game.createdAt,
        game.updatedAt,
      );
      const gameId = Number(insertedGame.lastInsertRowid);

      game.sideAPlayerIds.forEach((legacyPlayerId, index) => {
        const playerId = playerIdMap.get(legacyPlayerId);
        if (!playerId) {
          throw new Error(`Missing seeded player for ${legacyPlayerId}.`);
        }
        insertParticipant.run(gameId, playerId, "A", index + 1, game.createdAt);
      });

      game.sideBPlayerIds.forEach((legacyPlayerId, index) => {
        const playerId = playerIdMap.get(legacyPlayerId);
        if (!playerId) {
          throw new Error(`Missing seeded player for ${legacyPlayerId}.`);
        }
        insertParticipant.run(gameId, playerId, "B", index + 1, game.createdAt);
      });
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
