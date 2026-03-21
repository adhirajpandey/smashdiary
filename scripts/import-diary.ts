import { readFile } from "node:fs/promises";
import path from "node:path";

import { db } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import type { DiaryStore } from "@/lib/types";

const isImportLoggingEnabled = process.env.SMASHDIARY_LOGS === "1";

function logImportEvent(event: string, payload?: Record<string, unknown>) {
  if (!isImportLoggingEnabled) {
    return;
  }

  if (payload) {
    console.info(`[import-diary] ${event}`, payload);
    return;
  }

  console.info(`[import-diary] ${event}`);
}

function toIsoDateTime(dateTime: string) {
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${dateTime}`);
  }

  return parsed.toISOString();
}

async function run() {
  const dataPath = path.join(process.cwd(), "src", "data", "diary.json");
  logImportEvent("start", { dataPath });
  const raw = await readFile(dataPath, "utf8");
  const diary = JSON.parse(raw) as DiaryStore;

  if (diary.players.length > 0) {
    logImportEvent("players:importing", { count: diary.players.length });
    await db
      .insert(players)
      .values(
        diary.players.map((player) => ({
          id: player.id,
          name: player.name,
          createdAt: toIsoDateTime(player.createdAt),
          updatedAt: toIsoDateTime(player.updatedAt),
        })),
      )
      .onConflictDoNothing();
  }

  if (diary.games.length > 0) {
    logImportEvent("games:importing", { count: diary.games.length });
    await db
      .insert(games)
      .values(
        diary.games.map((game) => ({
          id: game.id,
          playedAt: toIsoDateTime(game.playedAt),
          format: game.format,
          sideAPlayerIds: game.sideAPlayerIds,
          sideBPlayerIds: game.sideBPlayerIds,
          sideAScore: game.sideAScore,
          sideBScore: game.sideBScore,
          winnerSide: game.winnerSide,
          createdAt: toIsoDateTime(game.createdAt),
          updatedAt: toIsoDateTime(game.updatedAt),
        })),
      )
      .onConflictDoNothing();
  }

  logImportEvent("done", { players: diary.players.length, games: diary.games.length });
  console.log(`Imported ${diary.players.length} players and ${diary.games.length} games from ${dataPath}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
