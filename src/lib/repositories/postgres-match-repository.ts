import { asc, desc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { gameParticipants, games, players } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { buildParticipantValues, normalizePlayedAt, normalizePlayerNames, resolveMatches, sortPlayers, type ResolvedMatchRow } from "@/lib/repositories/shared";
import type { MatchRepository } from "@/lib/repositories/types";

function logRepositoryEvent(event: string, payload?: Record<string, unknown>) {
  logger.info("postgres-match-repository", event, payload);
}

type WriteClient = Pick<ReturnType<typeof getDb>, "select" | "insert">;

async function selectResolvedMatches(whereMatchId?: number) {
  const db = getDb();
  const query = db
    .select({
      gameId: games.id,
      playedAt: games.playedAt,
      format: games.format,
      sideAScore: games.sideAScore,
      sideBScore: games.sideBScore,
      winnerSide: games.winnerSide,
      gameCreatedAt: games.createdAt,
      gameUpdatedAt: games.updatedAt,
      participantId: gameParticipants.id,
      side: gameParticipants.side,
      slot: gameParticipants.slot,
      playerId: players.id,
      playerName: players.name,
      playerCreatedAt: players.createdAt,
      playerUpdatedAt: players.updatedAt,
    })
    .from(games)
    .leftJoin(gameParticipants, eq(gameParticipants.gameId, games.id))
    .leftJoin(players, eq(players.id, gameParticipants.playerId))
    .orderBy(desc(games.playedAt), asc(gameParticipants.side), asc(gameParticipants.slot));

  const rows = whereMatchId ? await query.where(eq(games.id, whereMatchId)) : await query;
  return resolveMatches(rows as ResolvedMatchRow[]);
}

async function upsertPlayers(names: string[], client: WriteClient) {
  const ids: number[] = [];
  const knownByNameKey = new Map<string, number>();

  for (const { name, nameKey } of normalizePlayerNames(names)) {
    const cachedId = knownByNameKey.get(nameKey);
    if (cachedId) {
      ids.push(cachedId);
      continue;
    }

    const [existing] = await client.select({ id: players.id }).from(players).where(eq(players.nameKey, nameKey)).limit(1);

    if (existing) {
      knownByNameKey.set(nameKey, existing.id);
      ids.push(existing.id);
      continue;
    }

    const timestamp = new Date().toISOString();
    const [inserted] = await client
      .insert(players)
      .values({
        name,
        nameKey,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .onConflictDoNothing({ target: players.nameKey })
      .returning({ id: players.id });

    if (inserted) {
      knownByNameKey.set(nameKey, inserted.id);
      ids.push(inserted.id);
      continue;
    }

    const [concurrent] = await client.select({ id: players.id }).from(players).where(eq(players.nameKey, nameKey)).limit(1);
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
      const playedAt = normalizePlayedAt(input.playedAt);

      if (input.id) {
        const updated = await tx
          .update(games)
          .set({
            playedAt,
            format: input.format,
            sideAScore: input.sideAScore,
            sideBScore: input.sideBScore,
            winnerSide: input.winnerSide,
            updatedAt: timestamp,
          })
          .where(eq(games.id, input.id))
          .returning({ id: games.id });

        if (!updated[0]) {
          logRepositoryEvent("saveMatch:missing_match", { id: input.id });
          throw new Error("Match not found.");
        }

        await tx.delete(gameParticipants).where(eq(gameParticipants.gameId, input.id));

        const participantValues = buildParticipantValues(input.id, sideAPlayerIds, sideBPlayerIds, timestamp);
        if (participantValues.length) {
          await tx.insert(gameParticipants).values(participantValues);
        }

        logRepositoryEvent("saveMatch:updated", { id: updated[0].id });
        return updated[0].id;
      }

      const [created] = await tx
        .insert(games)
        .values({
          playedAt,
          format: input.format,
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

      const participantValues = buildParticipantValues(created.id, sideAPlayerIds, sideBPlayerIds, timestamp);
      if (participantValues.length) {
        await tx.insert(gameParticipants).values(participantValues);
      }

      logRepositoryEvent("saveMatch:created", { id: created.id });
      return created.id;
    });
  },
};
