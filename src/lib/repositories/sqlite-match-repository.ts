import type Database from "better-sqlite3";

import { getTestSqliteClient } from "@/lib/db/test-sqlite";
import { logger } from "@/lib/logger";
import { buildParticipantValues, normalizePlayedAt, normalizePlayerNames, resolveMatches, sortPlayers, type ResolvedMatchRow } from "@/lib/repositories/shared";
import type { MatchRepository } from "@/lib/repositories/types";

type PlayerRow = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};

function logRepositoryEvent(event: string, payload?: Record<string, unknown>) {
  logger.info("sqlite-match-repository", event, payload);
}

function getClient() {
  return getTestSqliteClient();
}

function readPlayers(client: Database.Database) {
  const playerRows = client
    .prepare(
      [
        "SELECT id, name, created_at AS createdAt, updated_at AS updatedAt",
        "FROM players",
      ].join(" "),
    )
    .all() as PlayerRow[];

  return sortPlayers(
    playerRows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
  );
}

function readResolvedMatches(client: Database.Database, id?: number) {
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

  const rows = (id ? statement.all(id) : statement.all()) as ResolvedMatchRow[];
  return resolveMatches(rows);
}

function upsertPlayers(names: string[], client: Database.Database) {
  const ids: number[] = [];
  const knownByNameKey = new Map<string, number>();
  const findByNameKey = client.prepare("SELECT id FROM players WHERE name_key = ? LIMIT 1");
  const insertPlayer = client.prepare(
    "INSERT INTO players (name, name_key, created_at, updated_at) VALUES (?, ?, ?, ?)",
  );

  for (const { name, nameKey } of normalizePlayerNames(names)) {
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

  for (const participant of buildParticipantValues(gameId, sideAPlayerIds, sideBPlayerIds, createdAt)) {
    insertParticipant.run(participant.gameId, participant.playerId, participant.side, participant.slot, participant.createdAt);
  }
}

export const sqliteMatchRepository: MatchRepository = {
  async listPlayers() {
    return readPlayers(getClient());
  },

  async listMatches() {
    return readResolvedMatches(getClient());
  },

  async getMatchById(id) {
    const matches = readResolvedMatches(getClient(), id);
    return matches[0] ?? null;
  },

  async saveMatch(input) {
    const client = getClient();
    logRepositoryEvent("saveMatch:start", {
      mode: input.id ? "update" : "create",
      format: input.format,
      sideAPlayers: input.sideAPlayers.length,
      sideBPlayers: input.sideBPlayers.length,
    });

    const run = client.transaction(() => {
      const timestamp = new Date().toISOString();
      const sideAPlayerIds = upsertPlayers(input.sideAPlayers, client);
      const sideBPlayerIds = upsertPlayers(input.sideBPlayers, client);
      const playedAt = normalizePlayedAt(input.playedAt);

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
          logRepositoryEvent("saveMatch:missing_match", { id: input.id });
          throw new Error("Match not found.");
        }

        client.prepare("DELETE FROM game_participants WHERE game_id = ?").run(input.id);
        insertParticipants(client, input.id, sideAPlayerIds, sideBPlayerIds, timestamp);

        logRepositoryEvent("saveMatch:updated", { id: input.id });
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

      const matchId = Number(inserted.lastInsertRowid);
      insertParticipants(client, matchId, sideAPlayerIds, sideBPlayerIds, timestamp);

      logRepositoryEvent("saveMatch:created", { id: matchId });
      return matchId;
    });

    return run();
  },

  async deleteMatch(id) {
    const client = getClient();
    logRepositoryEvent("deleteMatch:start", { id });

    const run = client.transaction(() => {
      client.prepare("DELETE FROM game_participants WHERE game_id = ?").run(id);
      const deleted = client.prepare("DELETE FROM games WHERE id = ?").run(id);

      if (!deleted.changes) {
        logRepositoryEvent("deleteMatch:missing_match", { id });
        return false;
      }

      logRepositoryEvent("deleteMatch:deleted", { id });
      return true;
    });

    return run();
  },
};
