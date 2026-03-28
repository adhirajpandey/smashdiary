import type Database from "better-sqlite3";

import { getTestSqliteClient } from "@/lib/db/test-sqlite";
import { logger } from "@/lib/logger";
import { MatchNotFoundError } from "@/lib/match-errors";
import {
  buildGamePlayerColumns,
  normalizePlayedOn,
  normalizePlayerNames,
  resolveMatches,
  sortPlayers,
  sortResolvedMatchesDescending,
  type ResolvedMatchRow,
} from "@/lib/repositories/shared";
import type { MatchRepository } from "@/lib/repositories/types";
import { normalizePlayerNameKey } from "@/lib/utils";

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
      "g.played_on AS playedOn,",
      "g.slot AS slot,",
      "g.format AS format,",
      "g.side_a_score AS sideAScore,",
      "g.side_b_score AS sideBScore,",
      "g.winner_side AS winnerSide,",
      "g.created_at AS gameCreatedAt,",
      "g.updated_at AS gameUpdatedAt,",
      "sap1.id AS sideAPlayer1Id,",
      "sap1.name AS sideAPlayer1Name,",
      "sap1.created_at AS sideAPlayer1CreatedAt,",
      "sap1.updated_at AS sideAPlayer1UpdatedAt,",
      "sap2.id AS sideAPlayer2Id,",
      "sap2.name AS sideAPlayer2Name,",
      "sap2.created_at AS sideAPlayer2CreatedAt,",
      "sap2.updated_at AS sideAPlayer2UpdatedAt,",
      "sbp1.id AS sideBPlayer1Id,",
      "sbp1.name AS sideBPlayer1Name,",
      "sbp1.created_at AS sideBPlayer1CreatedAt,",
      "sbp1.updated_at AS sideBPlayer1UpdatedAt,",
      "sbp2.id AS sideBPlayer2Id,",
      "sbp2.name AS sideBPlayer2Name,",
      "sbp2.created_at AS sideBPlayer2CreatedAt,",
      "sbp2.updated_at AS sideBPlayer2UpdatedAt",
      "FROM games g",
      "LEFT JOIN players sap1 ON sap1.id = g.side_a_player_1_id",
      "LEFT JOIN players sap2 ON sap2.id = g.side_a_player_2_id",
      "LEFT JOIN players sbp1 ON sbp1.id = g.side_b_player_1_id",
      "LEFT JOIN players sbp2 ON sbp2.id = g.side_b_player_2_id",
      id ? "WHERE g.id = ?" : "",
    ].filter(Boolean).join(" "),
  );

  const rows = (id ? statement.all(id) : statement.all()) as ResolvedMatchRow[];
  return sortResolvedMatchesDescending(resolveMatches(rows));
}

function upsertPlayers(names: string[], client: Database.Database) {
  const ids: number[] = [];
  const knownByNameKey = new Map<string, number>();
  const findByNameKey = client.prepare("SELECT id FROM players WHERE lower(name) = ? LIMIT 1");
  const insertPlayer = client.prepare(
    "INSERT INTO players (name, created_at, updated_at) VALUES (?, ?, ?)",
  );

  for (const name of normalizePlayerNames(names)) {
    const nameKey = normalizePlayerNameKey(name);
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
      const inserted = insertPlayer.run(name, timestamp, timestamp);
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
      const gamePlayerColumns = buildGamePlayerColumns(sideAPlayerIds, sideBPlayerIds);
      const playedOn = normalizePlayedOn(input.playedOn);

      if (input.id) {
        const updated = client
          .prepare(
            [
              "UPDATE games",
              [
                "SET played_on = ?, slot = ?, format = ?, side_a_player_1_id = ?, side_a_player_2_id = ?,",
                "side_b_player_1_id = ?, side_b_player_2_id = ?, side_a_score = ?, side_b_score = ?,",
                "winner_side = ?, updated_at = ?",
              ].join(" "),
              "WHERE id = ?",
            ].join(" "),
          )
          .run(
            playedOn,
            input.slot,
            input.format,
            gamePlayerColumns.sideAPlayer1Id,
            gamePlayerColumns.sideAPlayer2Id,
            gamePlayerColumns.sideBPlayer1Id,
            gamePlayerColumns.sideBPlayer2Id,
            input.sideAScore,
            input.sideBScore,
            input.winnerSide,
            timestamp,
            input.id,
          );

        if (!updated.changes) {
          logRepositoryEvent("saveMatch:missing_match", { id: input.id });
          throw new MatchNotFoundError();
        }

        logRepositoryEvent("saveMatch:updated", { id: input.id });
        return input.id;
      }

      const inserted = client
        .prepare(
          [
            "INSERT INTO games",
            [
              "(played_on, slot, format, side_a_player_1_id, side_a_player_2_id,",
              "side_b_player_1_id, side_b_player_2_id, side_a_score, side_b_score,",
              "winner_side, created_at, updated_at)",
            ].join(" "),
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          ].join(" "),
        )
        .run(
          playedOn,
          input.slot,
          input.format,
          gamePlayerColumns.sideAPlayer1Id,
          gamePlayerColumns.sideAPlayer2Id,
          gamePlayerColumns.sideBPlayer1Id,
          gamePlayerColumns.sideBPlayer2Id,
          input.sideAScore,
          input.sideBScore,
          input.winnerSide,
          timestamp,
          timestamp,
        );

      const matchId = Number(inserted.lastInsertRowid);

      logRepositoryEvent("saveMatch:created", { id: matchId });
      return matchId;
    });

    return run();
  },

  async deleteMatch(id) {
    const client = getClient();
    logRepositoryEvent("deleteMatch:start", { id });

    const run = client.transaction(() => {
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
