import type Database from "better-sqlite3";

import { getTestSqliteClient } from "@/lib/db/test-sqlite";
import { logger } from "@/lib/logger";
import type { Game, Player, ResolvedGame } from "@/lib/types";

type SaveGameInput = {
  id?: string;
  playedAt: string;
  format: Game["format"];
  sideAPlayers: string[];
  sideBPlayers: string[];
  sideAScore: number;
  sideBScore: number;
  winnerSide: Game["winnerSide"];
};

type PlayerRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type GameRow = {
  id: string;
  playedAt: string;
  format: string;
  sideAPlayerIds: string;
  sideBPlayerIds: string;
  sideAScore: number;
  sideBScore: number;
  winnerSide: string;
  createdAt: string;
  updatedAt: string;
};

function logStoreEvent(event: string, payload?: Record<string, unknown>) {
  logger.info("store-sqlite", event, payload);
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function toIsoDateTime(dateTime: string) {
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid match date.");
  }

  return parsed.toISOString();
}

function parsePlayerIdList(raw: string) {
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
}

function resolveGames(games: Game[], players: Player[]): ResolvedGame[] {
  return games
    .slice()
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
    .map((game) => ({
      ...game,
      sideAPlayers: game.sideAPlayerIds.map((id) => players.find((player) => player.id === id)).filter(Boolean) as Player[],
      sideBPlayers: game.sideBPlayerIds.map((id) => players.find((player) => player.id === id)).filter(Boolean) as Player[],
    }));
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

function readGames(client: Database.Database): Game[] {
  const gameRows = client
    .prepare(
      [
        "SELECT",
        "id,",
        "played_at AS playedAt,",
        "format,",
        "side_a_player_ids AS sideAPlayerIds,",
        "side_b_player_ids AS sideBPlayerIds,",
        "side_a_score AS sideAScore,",
        "side_b_score AS sideBScore,",
        "winner_side AS winnerSide,",
        "created_at AS createdAt,",
        "updated_at AS updatedAt",
        "FROM games",
        "ORDER BY played_at DESC",
      ].join(" "),
    )
    .all() as GameRow[];

  return gameRows.map((row) => ({
    id: row.id,
    playedAt: row.playedAt,
    format: row.format as Game["format"],
    sideAPlayerIds: parsePlayerIdList(row.sideAPlayerIds),
    sideBPlayerIds: parsePlayerIdList(row.sideBPlayerIds),
    sideAScore: row.sideAScore,
    sideBScore: row.sideBScore,
    winnerSide: row.winnerSide as Game["winnerSide"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

function upsertPlayersSqlite(names: string[], client: Database.Database) {
  const ids: string[] = [];
  const knownByLowerName = new Map<string, string>();
  const findByName = client.prepare("SELECT id FROM players WHERE lower(name) = lower(?) LIMIT 1");
  const insertPlayer = client.prepare(
    "INSERT INTO players (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
  );

  for (const rawName of names) {
    const name = normalizeName(rawName);
    const lowerName = name.toLowerCase();

    const cachedId = knownByLowerName.get(lowerName);
    if (cachedId) {
      ids.push(cachedId);
      continue;
    }

    const existing = findByName.get(name) as { id: string } | undefined;
    if (existing) {
      knownByLowerName.set(lowerName, existing.id);
      ids.push(existing.id);
      continue;
    }

    const timestamp = new Date().toISOString();
    const id = makeId("p");

    try {
      insertPlayer.run(id, name, timestamp, timestamp);
      knownByLowerName.set(lowerName, id);
      ids.push(id);
      continue;
    } catch {
      const concurrent = findByName.get(name) as { id: string } | undefined;
      if (!concurrent) {
        throw new Error("Could not save player.");
      }
      knownByLowerName.set(lowerName, concurrent.id);
      ids.push(concurrent.id);
    }
  }

  return ids;
}

export async function listPlayersSqlite() {
  const players = readPlayers(getClient());
  return players.slice().sort((a, b) => {
    const aIsSagar = a.name.toLowerCase() === "sagar";
    const bIsSagar = b.name.toLowerCase() === "sagar";
    if (aIsSagar && !bIsSagar) {
      return -1;
    }
    if (!aIsSagar && bIsSagar) {
      return 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function listGamesSqlite() {
  const client = getClient();
  const players = readPlayers(client);
  const games = readGames(client);
  return resolveGames(games, players);
}

export async function getGameByIdSqlite(id: string) {
  const client = getClient();
  const gameRow = client
    .prepare(
      [
        "SELECT",
        "id,",
        "played_at AS playedAt,",
        "format,",
        "side_a_player_ids AS sideAPlayerIds,",
        "side_b_player_ids AS sideBPlayerIds,",
        "side_a_score AS sideAScore,",
        "side_b_score AS sideBScore,",
        "winner_side AS winnerSide,",
        "created_at AS createdAt,",
        "updated_at AS updatedAt",
        "FROM games",
        "WHERE id = ? LIMIT 1",
      ].join(" "),
    )
    .get(id) as GameRow | undefined;

  if (!gameRow) {
    return null;
  }

  const players = readPlayers(client);
  const game: Game = {
    id: gameRow.id,
    playedAt: gameRow.playedAt,
    format: gameRow.format as Game["format"],
    sideAPlayerIds: parsePlayerIdList(gameRow.sideAPlayerIds),
    sideBPlayerIds: parsePlayerIdList(gameRow.sideBPlayerIds),
    sideAScore: gameRow.sideAScore,
    sideBScore: gameRow.sideBScore,
    winnerSide: gameRow.winnerSide as Game["winnerSide"],
    createdAt: gameRow.createdAt,
    updatedAt: gameRow.updatedAt,
  };

  return resolveGames([game], players)[0] ?? null;
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
            "SET played_at = ?, format = ?, side_a_player_ids = ?, side_b_player_ids = ?,",
            "side_a_score = ?, side_b_score = ?, winner_side = ?, updated_at = ?",
            "WHERE id = ?",
          ].join(" "),
        )
        .run(
          playedAt,
          input.format,
          JSON.stringify(sideAPlayerIds),
          JSON.stringify(sideBPlayerIds),
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

      logStoreEvent("saveGame:updated", { id: input.id });
      return input.id;
    }

    const id = makeId("g");
    client
      .prepare(
        [
          "INSERT INTO games",
          "(id, played_at, format, side_a_player_ids, side_b_player_ids, side_a_score, side_b_score, winner_side, created_at, updated_at)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ].join(" "),
      )
      .run(
        id,
        playedAt,
        input.format,
        JSON.stringify(sideAPlayerIds),
        JSON.stringify(sideBPlayerIds),
        input.sideAScore,
        input.sideBScore,
        input.winnerSide,
        timestamp,
        timestamp,
      );

    logStoreEvent("saveGame:created", { id });
    return id;
  });

  return run();
}
