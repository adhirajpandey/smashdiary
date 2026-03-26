import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import type { Game, Player, ResolvedGame } from "@/lib/types";

export type SaveGameInput = {
  id?: string;
  playedAt: string;
  format: Game["format"];
  sideAPlayers: string[];
  sideBPlayers: string[];
  sideAScore: number;
  sideBScore: number;
  winnerSide: Game["winnerSide"];
};

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

function resolveGames(allGames: Game[], allPlayers: Player[]): ResolvedGame[] {
  return allGames
    .slice()
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
    .map((game) => ({
      ...game,
      sideAPlayers: game.sideAPlayerIds.map((id) => allPlayers.find((player) => player.id === id)).filter(Boolean) as Player[],
      sideBPlayers: game.sideBPlayerIds.map((id) => allPlayers.find((player) => player.id === id)).filter(Boolean) as Player[],
    }));
}

function mapPlayer(row: typeof players.$inferSelect): Player {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapGame(row: typeof games.$inferSelect): Game {
  return {
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
  };
}

type WriteDatabase = ReturnType<typeof getDb>;
type WriteClient = Pick<WriteDatabase, "select" | "insert">;

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

export async function listPlayersRepo() {
  const db = getDb();
  const rows = await db.select().from(players);

  return rows.map(mapPlayer).sort((a, b) => {
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

export async function listGamesRepo() {
  const db = getDb();
  const [playerRows, gameRows] = await Promise.all([
    db.select().from(players),
    db.select().from(games).orderBy(desc(games.playedAt)),
  ]);

  return resolveGames(gameRows.map(mapGame), playerRows.map(mapPlayer));
}

export async function getGameByIdRepo(id: string) {
  const db = getDb();
  const [gameRows, playerRows] = await Promise.all([
    db.select().from(games).where(eq(games.id, id)).limit(1),
    db.select().from(players),
  ]);

  if (!gameRows[0]) {
    return null;
  }

  return resolveGames([mapGame(gameRows[0])], playerRows.map(mapPlayer))[0] ?? null;
}

export async function saveGameRepo(input: SaveGameInput) {
  const db = getDb();

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
        return null;
      }

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

    return id;
  });
}

export async function deleteGameRepo(id: string) {
  const db = getDb();
  const deleted = await db.delete(games).where(eq(games.id, id)).returning({ id: games.id });
  return Boolean(deleted[0]);
}
