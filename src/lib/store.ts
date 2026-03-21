import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import type { DiaryStore, Game, Player, ResolvedGame } from "@/lib/types";

const isStoreLoggingEnabled = process.env.SMASHDIARY_LOGS === "1";

function logStoreEvent(event: string, payload?: Record<string, unknown>) {
  if (!isStoreLoggingEnabled) {
    return;
  }

  if (payload) {
    console.info(`[store] ${event}`, payload);
    return;
  }

  console.info(`[store] ${event}`);
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

function resolveGames(store: DiaryStore): ResolvedGame[] {
  return store.games
    .slice()
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
    .map((game) => ({
      ...game,
      sideAPlayers: game.sideAPlayerIds.map((id) => store.players.find((player) => player.id === id)).filter(Boolean) as Player[],
      sideBPlayers: game.sideBPlayerIds.map((id) => store.players.find((player) => player.id === id)).filter(Boolean) as Player[],
    }));
}

async function readStore(): Promise<DiaryStore> {
  const [playerRows, gameRows] = await Promise.all([
    db.select().from(players),
    db.select().from(games).orderBy(desc(games.playedAt)),
  ]);

  return {
    players: playerRows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    games: gameRows.map((row) => ({
      id: row.id,
      playedAt: row.playedAt,
      format: row.format as Game["format"],
      sideAPlayerIds: row.sideAPlayerIds,
      sideBPlayerIds: row.sideBPlayerIds,
      sideAScore: row.sideAScore,
      sideBScore: row.sideBScore,
      winnerSide: row.winnerSide as Game["winnerSide"],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
  };
}

type WriteClient = Pick<typeof db, "select" | "insert">;

async function upsertPlayers(names: string[], client: WriteClient) {
  const ids: string[] = [];
  const knownByLowerName = new Map<string, string>();

  for (const rawName of names) {
    const name = normalizeName(rawName);
    const lowerName = name.toLowerCase();

    const cachedId = knownByLowerName.get(lowerName);
    if (cachedId) {
      ids.push(cachedId);
      continue;
    }

    const [existing] = await client
      .select({ id: players.id })
      .from(players)
      .where(sql`lower(${players.name}) = ${lowerName}`)
      .limit(1);

    if (existing) {
      knownByLowerName.set(lowerName, existing.id);
      ids.push(existing.id);
      continue;
    }

    const timestamp = new Date().toISOString();
    const id = makeId("p");

    try {
      await client.insert(players).values({
        id,
        name,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      knownByLowerName.set(lowerName, id);
      ids.push(id);
      continue;
    } catch {
      const [concurrent] = await client
        .select({ id: players.id })
        .from(players)
        .where(sql`lower(${players.name}) = ${lowerName}`)
        .limit(1);

      if (!concurrent) {
        throw new Error("Could not save player.");
      }

      knownByLowerName.set(lowerName, concurrent.id);
      ids.push(concurrent.id);
    }
  }

  return ids;
}

export async function listPlayers() {
  const store = await readStore();
  return store.players.slice().sort((a, b) => {
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
  const store = await readStore();
  return resolveGames(store);
}

export async function getGameById(id: string) {
  const [gameRow, playerRows] = await Promise.all([
    db
      .select()
      .from(games)
      .where(eq(games.id, id))
      .limit(1),
    db.select().from(players),
  ]);

  if (!gameRow[0]) {
    return null;
  }

  const store: DiaryStore = {
    players: playerRows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    games: [
      {
        id: gameRow[0].id,
        playedAt: gameRow[0].playedAt,
        format: gameRow[0].format as Game["format"],
        sideAPlayerIds: gameRow[0].sideAPlayerIds,
        sideBPlayerIds: gameRow[0].sideBPlayerIds,
        sideAScore: gameRow[0].sideAScore,
        sideBScore: gameRow[0].sideBScore,
        winnerSide: gameRow[0].winnerSide as Game["winnerSide"],
        createdAt: gameRow[0].createdAt,
        updatedAt: gameRow[0].updatedAt,
      },
    ],
  };

  return resolveGames(store)[0] ?? null;
}

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

export async function saveGame(input: SaveGameInput) {
  logStoreEvent("saveGame:start", {
    mode: input.id ? "update" : "create",
    format: input.format,
    sideAPlayers: input.sideAPlayers.length,
    sideBPlayers: input.sideBPlayers.length,
  });

  return db.transaction(async (tx) => {
    const timestamp = new Date().toISOString();
    const sideAPlayerIds = await upsertPlayers(input.sideAPlayers, tx);
    const sideBPlayerIds = await upsertPlayers(input.sideBPlayers, tx);
    const playedAt = toIsoDateTime(input.playedAt);

    if (input.id) {
      const updated = await tx
        .update(games)
        .set({
          playedAt,
          format: input.format,
          sideAPlayerIds,
          sideBPlayerIds,
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

      logStoreEvent("saveGame:updated", { id: updated[0].id });
      return updated[0].id;
    }

    const id = makeId("g");

    await tx.insert(games).values({
      id,
      playedAt,
      format: input.format,
      sideAPlayerIds,
      sideBPlayerIds,
      sideAScore: input.sideAScore,
      sideBScore: input.sideBScore,
      winnerSide: input.winnerSide,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    logStoreEvent("saveGame:created", { id });
    return id;
  });
}

export async function deleteGame(id: string) {
  logStoreEvent("deleteGame:start", { id });
  const deleted = await db.delete(games).where(eq(games.id, id)).returning({ id: games.id });

  if (!deleted[0]) {
    logStoreEvent("deleteGame:missing_game", { id });
    throw new Error("Game not found.");
  }

  logStoreEvent("deleteGame:deleted", { id: deleted[0].id });
}
