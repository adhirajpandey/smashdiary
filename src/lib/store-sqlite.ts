import type Database from "better-sqlite3";

import { getTestSqliteClient } from "@/lib/db/test-sqlite";
import { logger } from "@/lib/logger";
import type { Game, GameParticipant, Player, ResolvedGame } from "@/lib/types";
import { normalizePlayerName, normalizePlayerNameKey } from "@/lib/utils";

type SaveGameInput = {
  id?: number;
  playedAt: string;
  format: Game["format"];
  sideAPlayers: string[];
  sideBPlayers: string[];
  sideAScore: number;
  sideBScore: number;
  winnerSide: Game["winnerSide"];
};

type PlayerRow = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type JoinedGameRow = {
  gameId: number;
  playedAt: string;
  format: Game["format"];
  sideAScore: number;
  sideBScore: number;
  winnerSide: Game["winnerSide"];
  gameCreatedAt: string;
  gameUpdatedAt: string;
  participantId: number | null;
  side: GameParticipant["side"] | null;
  slot: number | null;
  playerId: number | null;
  playerName: string | null;
  playerCreatedAt: string | null;
  playerUpdatedAt: string | null;
};

function logStoreEvent(event: string, payload?: Record<string, unknown>) {
  logger.info("store-sqlite", event, payload);
}

function toIsoDateTime(dateTime: string) {
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid match date.");
  }

  return parsed.toISOString();
}

function resolveGames(rows: JoinedGameRow[]) {
  const resolvedById = new Map<number, ResolvedGame>();

  for (const row of rows) {
    let game = resolvedById.get(row.gameId);
    if (!game) {
      game = {
        id: row.gameId,
        playedAt: row.playedAt,
        format: row.format,
        sideAScore: row.sideAScore,
        sideBScore: row.sideBScore,
        winnerSide: row.winnerSide,
        createdAt: row.gameCreatedAt,
        updatedAt: row.gameUpdatedAt,
        sideAPlayers: [],
        sideBPlayers: [],
      };
      resolvedById.set(row.gameId, game);
    }

    if (!row.playerId || !row.playerName || !row.playerCreatedAt || !row.playerUpdatedAt || !row.side) {
      continue;
    }

    const player: Player = {
      id: row.playerId,
      name: row.playerName,
      createdAt: row.playerCreatedAt,
      updatedAt: row.playerUpdatedAt,
    };

    if (row.side === "A") {
      game.sideAPlayers.push(player);
    } else {
      game.sideBPlayers.push(player);
    }
  }

  return Array.from(resolvedById.values());
}

function getClient() {
  return getTestSqliteClient();
}

function readPlayers(client: Database.Database): Player[] {
  const playerRows = client
    .prepare(
      [
        "SELECT id, name, created_at AS createdAt, updated_at AS updatedAt",
        "FROM players",
      ].join(" "),
    )
    .all() as PlayerRow[];

  return playerRows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

function readResolvedGames(client: Database.Database, id?: number) {
  const statement = client.prepare(
    [
      "SELECT",
      "g.id AS gameId,",
      "g.played_at AS playedAt,",
      "g.format AS format,",
      "g.side_a_score AS sideAScore,",
      "g.side_b_score AS sideBScore,",
      "g.winner_side AS winnerSide,",
      "g.created_at AS gameCreatedAt,",
      "g.updated_at AS gameUpdatedAt,",
      "gp.id AS participantId,",
      "gp.side AS side,",
      "gp.slot AS slot,",
      "p.id AS playerId,",
      "p.name AS playerName,",
      "p.created_at AS playerCreatedAt,",
      "p.updated_at AS playerUpdatedAt",
      "FROM games g",
      "LEFT JOIN game_participants gp ON gp.game_id = g.id",
      "LEFT JOIN players p ON p.id = gp.player_id",
      id ? "WHERE g.id = ?" : "",
      "ORDER BY g.played_at DESC, gp.side ASC, gp.slot ASC",
    ].filter(Boolean).join(" "),
  );

  const rows = (id ? statement.all(id) : statement.all()) as JoinedGameRow[];
  return resolveGames(rows);
}

function upsertPlayersSqlite(names: string[], client: Database.Database) {
  const ids: number[] = [];
  const knownByNameKey = new Map<string, number>();
  const findByNameKey = client.prepare("SELECT id FROM players WHERE name_key = ? LIMIT 1");
  const insertPlayer = client.prepare(
    "INSERT INTO players (name, name_key, created_at, updated_at) VALUES (?, ?, ?, ?)",
  );

  for (const rawName of names) {
    const name = normalizePlayerName(rawName);
    const nameKey = normalizePlayerNameKey(rawName);
    const cachedId = knownByNameKey.get(nameKey);

    if (cachedId) {
      ids.push(cachedId);
      continue;
    }

    const existing = findByNameKey.get(nameKey) as { id: number } | undefined;
    if (existing) {
      knownByNameKey.set(nameKey, existing.id);
      ids.push(existing.id);
      continue;
    }

    const timestamp = new Date().toISOString();

    try {
      const inserted = insertPlayer.run(name, nameKey, timestamp, timestamp);
      const id = Number(inserted.lastInsertRowid);
      knownByNameKey.set(nameKey, id);
      ids.push(id);
      continue;
    } catch {
      const concurrent = findByNameKey.get(nameKey) as { id: number } | undefined;
      if (!concurrent) {
        throw new Error("Could not save player.");
      }
      knownByNameKey.set(nameKey, concurrent.id);
      ids.push(concurrent.id);
    }
  }

  return ids;
}

function insertParticipants(client: Database.Database, gameId: number, sideAPlayerIds: number[], sideBPlayerIds: number[], createdAt: string) {
  const insertParticipant = client.prepare(
    "INSERT INTO game_participants (game_id, player_id, side, slot, created_at) VALUES (?, ?, ?, ?, ?)",
  );

  sideAPlayerIds.forEach((playerId, index) => {
    insertParticipant.run(gameId, playerId, "A", index + 1, createdAt);
  });

  sideBPlayerIds.forEach((playerId, index) => {
    insertParticipant.run(gameId, playerId, "B", index + 1, createdAt);
  });
}

export async function listPlayersSqlite() {
  const players = readPlayers(getClient());
  return players.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function listGamesSqlite() {
  return readResolvedGames(getClient());
}

export async function getGameByIdSqlite(id: number) {
  const games = readResolvedGames(getClient(), id);
  return games[0] ?? null;
}

export async function saveGameSqlite(input: SaveGameInput) {
  const client = getClient();
  logStoreEvent("saveGame:start", {
    mode: input.id ? "update" : "create",
    format: input.format,
    sideAPlayers: input.sideAPlayers.length,
    sideBPlayers: input.sideBPlayers.length,
  });

  const run = client.transaction(() => {
    const timestamp = new Date().toISOString();
    const sideAPlayerIds = upsertPlayersSqlite(input.sideAPlayers, client);
    const sideBPlayerIds = upsertPlayersSqlite(input.sideBPlayers, client);
    const playedAt = toIsoDateTime(input.playedAt);

    if (input.id) {
      const updated = client
        .prepare(
          [
            "UPDATE games",
            "SET played_at = ?, format = ?, side_a_score = ?, side_b_score = ?, winner_side = ?, updated_at = ?",
            "WHERE id = ?",
          ].join(" "),
        )
        .run(
          playedAt,
          input.format,
          input.sideAScore,
          input.sideBScore,
          input.winnerSide,
          timestamp,
          input.id,
        );

      if (!updated.changes) {
        logStoreEvent("saveGame:missing_game", { id: input.id });
        throw new Error("Game not found.");
      }

      client.prepare("DELETE FROM game_participants WHERE game_id = ?").run(input.id);
      insertParticipants(client, input.id, sideAPlayerIds, sideBPlayerIds, timestamp);

      logStoreEvent("saveGame:updated", { id: input.id });
      return input.id;
    }

    const inserted = client
      .prepare(
        [
          "INSERT INTO games",
          "(played_at, format, side_a_score, side_b_score, winner_side, created_at, updated_at)",
          "VALUES (?, ?, ?, ?, ?, ?, ?)",
        ].join(" "),
      )
      .run(
        playedAt,
        input.format,
        input.sideAScore,
        input.sideBScore,
        input.winnerSide,
        timestamp,
        timestamp,
      );

    const gameId = Number(inserted.lastInsertRowid);
    insertParticipants(client, gameId, sideAPlayerIds, sideBPlayerIds, timestamp);

    logStoreEvent("saveGame:created", { id: gameId });
    return gameId;
  });

  return run();
}
