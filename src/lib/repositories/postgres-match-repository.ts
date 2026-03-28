import { eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { getDb } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
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

function logRepositoryEvent(event: string, payload?: Record<string, unknown>) {
  logger.info("postgres-match-repository", event, payload);
}

type WriteClient = Pick<ReturnType<typeof getDb>, "select" | "insert">;

async function selectResolvedMatches(whereMatchId?: number) {
  const db = getDb();
  const sideAPlayer1 = alias(players, "side_a_player_1");
  const sideAPlayer2 = alias(players, "side_a_player_2");
  const sideBPlayer1 = alias(players, "side_b_player_1");
  const sideBPlayer2 = alias(players, "side_b_player_2");
  const query = db
    .select({
      gameId: games.id,
      playedOn: games.playedOn,
      slot: games.slot,
      format: games.format,
      sideAScore: games.sideAScore,
      sideBScore: games.sideBScore,
      winnerSide: games.winnerSide,
      gameCreatedAt: games.createdAt,
      gameUpdatedAt: games.updatedAt,
      sideAPlayer1Id: sideAPlayer1.id,
      sideAPlayer1Name: sideAPlayer1.name,
      sideAPlayer1CreatedAt: sideAPlayer1.createdAt,
      sideAPlayer1UpdatedAt: sideAPlayer1.updatedAt,
      sideAPlayer2Id: sideAPlayer2.id,
      sideAPlayer2Name: sideAPlayer2.name,
      sideAPlayer2CreatedAt: sideAPlayer2.createdAt,
      sideAPlayer2UpdatedAt: sideAPlayer2.updatedAt,
      sideBPlayer1Id: sideBPlayer1.id,
      sideBPlayer1Name: sideBPlayer1.name,
      sideBPlayer1CreatedAt: sideBPlayer1.createdAt,
      sideBPlayer1UpdatedAt: sideBPlayer1.updatedAt,
      sideBPlayer2Id: sideBPlayer2.id,
      sideBPlayer2Name: sideBPlayer2.name,
      sideBPlayer2CreatedAt: sideBPlayer2.createdAt,
      sideBPlayer2UpdatedAt: sideBPlayer2.updatedAt,
    })
    .from(games)
    .leftJoin(sideAPlayer1, eq(sideAPlayer1.id, games.sideAPlayer1Id))
    .leftJoin(sideAPlayer2, eq(sideAPlayer2.id, games.sideAPlayer2Id))
    .leftJoin(sideBPlayer1, eq(sideBPlayer1.id, games.sideBPlayer1Id))
    .leftJoin(sideBPlayer2, eq(sideBPlayer2.id, games.sideBPlayer2Id));

  const rows = whereMatchId ? await query.where(eq(games.id, whereMatchId)) : await query;
  return sortResolvedMatchesDescending(resolveMatches(rows as ResolvedMatchRow[]));
}

async function upsertPlayers(names: string[], client: WriteClient) {
  const ids: number[] = [];
  const knownByNameKey = new Map<string, number>();

  for (const name of normalizePlayerNames(names)) {
    const nameKey = normalizePlayerNameKey(name);
    const cachedId = knownByNameKey.get(nameKey);
    if (cachedId) {
      ids.push(cachedId);
      continue;
    }

    const [existing] = await client
      .select({ id: players.id })
      .from(players)
      .where(sql`lower(${players.name}) = ${nameKey}`)
      .limit(1);

    if (existing) {
      knownByNameKey.set(nameKey, existing.id);
      ids.push(existing.id);
      continue;
    }

    const timestamp = new Date().toISOString();

    try {
      const [inserted] = await client
        .insert(players)
        .values({
          name,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning({ id: players.id });

      if (inserted) {
        knownByNameKey.set(nameKey, inserted.id);
        ids.push(inserted.id);
        continue;
      }
    } catch {}

    const [concurrent] = await client
      .select({ id: players.id })
      .from(players)
      .where(sql`lower(${players.name}) = ${nameKey}`)
      .limit(1);
    if (!concurrent) {
      throw new Error("Could not save player.");
    }

    knownByNameKey.set(nameKey, concurrent.id);
    ids.push(concurrent.id);
  }

  return ids;
}

export const postgresMatchRepository: MatchRepository = {
  async listPlayers() {
    const playerRows = await getDb().select().from(players);

    return sortPlayers(
      playerRows.map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    );
  },

  async listMatches() {
    return selectResolvedMatches();
  },

  async getMatchById(id) {
    const matches = await selectResolvedMatches(id);
    return matches[0] ?? null;
  },

  async saveMatch(input) {
    const db = getDb();
    logRepositoryEvent("saveMatch:start", {
      mode: input.id ? "update" : "create",
      format: input.format,
      sideAPlayers: input.sideAPlayers.length,
      sideBPlayers: input.sideBPlayers.length,
    });

    return db.transaction(async (tx) => {
      const timestamp = new Date().toISOString();
      const sideAPlayerIds = await upsertPlayers(input.sideAPlayers, tx as WriteClient);
      const sideBPlayerIds = await upsertPlayers(input.sideBPlayers, tx as WriteClient);
      const gamePlayerColumns = buildGamePlayerColumns(sideAPlayerIds, sideBPlayerIds);
      const playedOn = normalizePlayedOn(input.playedOn);

      if (input.id) {
        const updated = await tx
          .update(games)
          .set({
            playedOn,
            slot: input.slot,
            format: input.format,
            ...gamePlayerColumns,
            sideAScore: input.sideAScore,
            sideBScore: input.sideBScore,
            winnerSide: input.winnerSide,
            updatedAt: timestamp,
          })
          .where(eq(games.id, input.id))
          .returning({ id: games.id });

        if (!updated[0]) {
          logRepositoryEvent("saveMatch:missing_match", { id: input.id });
          throw new MatchNotFoundError();
        }

        logRepositoryEvent("saveMatch:updated", { id: updated[0].id });
        return updated[0].id;
      }

      const [created] = await tx
        .insert(games)
        .values({
          playedOn,
          slot: input.slot,
          format: input.format,
          ...gamePlayerColumns,
          sideAScore: input.sideAScore,
          sideBScore: input.sideBScore,
          winnerSide: input.winnerSide,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning({ id: games.id });

      if (!created) {
        throw new Error("Could not create match.");
      }

      logRepositoryEvent("saveMatch:created", { id: created.id });
      return created.id;
    });
  },

  async deleteMatch(id) {
    const db = getDb();
    logRepositoryEvent("deleteMatch:start", { id });

    return db.transaction(async (tx) => {
      const deleted = await tx.delete(games).where(eq(games.id, id)).returning({ id: games.id });

      if (!deleted[0]) {
        logRepositoryEvent("deleteMatch:missing_match", { id });
        return false;
      }

      logRepositoryEvent("deleteMatch:deleted", { id });
      return true;
    });
  },
};
