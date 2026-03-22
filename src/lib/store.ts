import { asc, desc, eq } from "drizzle-orm";

import { gameParticipants, games, players } from "@/lib/db/schema";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isTestMode } from "@/lib/runtime-mode";
import { getGameByIdSqlite, listGamesSqlite, listPlayersSqlite, saveGameSqlite } from "@/lib/store-sqlite";
import type { Game, GameParticipant, Player, ResolvedGame } from "@/lib/types";
import { normalizePlayerName, normalizePlayerNameKey } from "@/lib/utils";

function logStoreEvent(event: string, payload?: Record<string, unknown>) {
  logger.info("store", event, payload);
}

function toIsoDateTime(dateTime: string) {
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid match date.");
  }

  return parsed.toISOString();
}

type GameRow = {
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

function resolveGames(rows: GameRow[]) {
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

async function selectResolvedGames(whereGameId?: number) {
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

  const rows = whereGameId ? await query.where(eq(games.id, whereGameId)) : await query;
  return resolveGames(rows as GameRow[]);
}

type WriteClient = Pick<ReturnType<typeof getDb>, "select" | "insert">;

async function upsertPlayers(names: string[], client: WriteClient) {
  const ids: number[] = [];
  const knownByNameKey = new Map<string, number>();

  for (const rawName of names) {
    const name = normalizePlayerName(rawName);
    const nameKey = normalizePlayerNameKey(rawName);

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

function buildParticipantValues(gameId: number, sideAPlayerIds: number[], sideBPlayerIds: number[], createdAt: string) {
  return [
    ...sideAPlayerIds.map((playerId, index) => ({
      gameId,
      playerId,
      side: "A" as const,
      slot: (index + 1) as 1 | 2,
      createdAt,
    })),
    ...sideBPlayerIds.map((playerId, index) => ({
      gameId,
      playerId,
      side: "B" as const,
      slot: (index + 1) as 1 | 2,
      createdAt,
    })),
  ];
}

export async function listPlayers() {
  if (isTestMode()) {
    return listPlayersSqlite();
  }

  const playerRows = await getDb().select().from(players);

  return playerRows
    .map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }))
    .sort((a, b) => {
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

export async function listGames() {
  if (isTestMode()) {
    return listGamesSqlite();
  }

  return selectResolvedGames();
}

export async function getGameById(id: number) {
  if (isTestMode()) {
    return getGameByIdSqlite(id);
  }

  const resolvedGames = await selectResolvedGames(id);
  return resolvedGames[0] ?? null;
}

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

export async function saveGame(input: SaveGameInput) {
  if (isTestMode()) {
    return saveGameSqlite(input);
  }

  const db = getDb();
  logStoreEvent("saveGame:start", {
    mode: input.id ? "update" : "create",
    format: input.format,
    sideAPlayers: input.sideAPlayers.length,
    sideBPlayers: input.sideBPlayers.length,
  });

  return db.transaction(async (tx) => {
    const timestamp = new Date().toISOString();
    const sideAPlayerIds = await upsertPlayers(input.sideAPlayers, tx as WriteClient);
    const sideBPlayerIds = await upsertPlayers(input.sideBPlayers, tx as WriteClient);
    const playedAt = toIsoDateTime(input.playedAt);

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
        logStoreEvent("saveGame:missing_game", { id: input.id });
        throw new Error("Game not found.");
      }

      await tx.delete(gameParticipants).where(eq(gameParticipants.gameId, input.id));

      const participantValues = buildParticipantValues(input.id, sideAPlayerIds, sideBPlayerIds, timestamp);
      if (participantValues.length) {
        await tx.insert(gameParticipants).values(participantValues);
      }

      logStoreEvent("saveGame:updated", { id: updated[0].id });
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
      throw new Error("Could not create game.");
    }

    const participantValues = buildParticipantValues(created.id, sideAPlayerIds, sideBPlayerIds, timestamp);
    if (participantValues.length) {
      await tx.insert(gameParticipants).values(participantValues);
    }

    logStoreEvent("saveGame:created", { id: created.id });
    return created.id;
  });
}
