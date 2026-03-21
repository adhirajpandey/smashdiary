import { promises as fs } from "node:fs";
import path from "node:path";

import seedStore from "@/data/seed.json";
import type { DiaryStore, Game, Player, ResolvedGame, StatsSummary } from "@/lib/types";

const dataFilePath = path.join(process.cwd(), "src", "data", "diary.json");

async function ensureStoreFile() {
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify(seedStore, null, 2));
  }
}

async function readStore(): Promise<DiaryStore> {
  await ensureStoreFile();
  const raw = await fs.readFile(dataFilePath, "utf8");
  return JSON.parse(raw) as DiaryStore;
}

async function writeStore(store: DiaryStore) {
  await fs.writeFile(dataFilePath, JSON.stringify(store, null, 2));
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
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

async function upsertPlayers(names: string[], store: DiaryStore) {
  const ids: string[] = [];

  for (const rawName of names) {
    const name = normalizeName(rawName);
    const existing = store.players.find((player) => player.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      ids.push(existing.id);
      continue;
    }

    const timestamp = new Date().toISOString();
    const player: Player = {
      id: makeId("p"),
      name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.players.push(player);
    ids.push(player.id);
  }

  return ids;
}

export async function listPlayers() {
  const store = await readStore();
  return store.players.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export async function listGames() {
  const store = await readStore();
  return resolveGames(store);
}

export async function getGameById(id: string) {
  const store = await readStore();
  return resolveGames(store).find((game) => game.id === id) ?? null;
}

export async function getStats(): Promise<StatsSummary> {
  const games = await listGames();

  const wins = games.filter((game) => game.winnerSide === "A").length;
  const losses = games.length - wins;
  const recentForm = games.slice(0, 6).map((game) => (game.winnerSide === "A" ? "W" : "L"));

  return {
    totalGames: games.length,
    wins,
    losses,
    recentForm,
    singlesGames: games.filter((game) => game.format === "singles").length,
    doublesGames: games.filter((game) => game.format === "doubles").length,
  };
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
  const store = await readStore();
  const timestamp = new Date().toISOString();
  const sideAPlayerIds = await upsertPlayers(input.sideAPlayers, store);
  const sideBPlayerIds = await upsertPlayers(input.sideBPlayers, store);

  if (input.id) {
    const existing = store.games.find((game) => game.id === input.id);
    if (!existing) {
      throw new Error("Game not found.");
    }

    existing.playedAt = input.playedAt;
    existing.format = input.format;
    existing.sideAPlayerIds = sideAPlayerIds;
    existing.sideBPlayerIds = sideBPlayerIds;
    existing.sideAScore = input.sideAScore;
    existing.sideBScore = input.sideBScore;
    existing.winnerSide = input.winnerSide;
    existing.updatedAt = timestamp;
    await writeStore(store);
    return existing.id;
  }

  const game: Game = {
    id: makeId("g"),
    playedAt: input.playedAt,
    format: input.format,
    sideAPlayerIds,
    sideBPlayerIds,
    sideAScore: input.sideAScore,
    sideBScore: input.sideBScore,
    winnerSide: input.winnerSide,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.games.push(game);
  await writeStore(store);
  return game.id;
}

export async function deleteGame(id: string) {
  const store = await readStore();
  const nextGames = store.games.filter((game) => game.id !== id);

  if (nextGames.length === store.games.length) {
    throw new Error("Game not found.");
  }

  store.games = nextGames;
  await writeStore(store);
}
