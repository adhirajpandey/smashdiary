import type { Game, Player } from "@/lib/types";
import { normalizePlayedAtValue, normalizePlayerName } from "@/lib/utils";

export type ResolvedMatchRow = {
  gameId: number;
  playedAt: string;
  format: Game["format"];
  sideAScore: number;
  sideBScore: number;
  winnerSide: Game["winnerSide"];
  gameCreatedAt: string;
  gameUpdatedAt: string;
  sideAPlayer1Id: number | null;
  sideAPlayer1Name: string | null;
  sideAPlayer1CreatedAt: string | null;
  sideAPlayer1UpdatedAt: string | null;
  sideAPlayer2Id: number | null;
  sideAPlayer2Name: string | null;
  sideAPlayer2CreatedAt: string | null;
  sideAPlayer2UpdatedAt: string | null;
  sideBPlayer1Id: number | null;
  sideBPlayer1Name: string | null;
  sideBPlayer1CreatedAt: string | null;
  sideBPlayer1UpdatedAt: string | null;
  sideBPlayer2Id: number | null;
  sideBPlayer2Name: string | null;
  sideBPlayer2CreatedAt: string | null;
  sideBPlayer2UpdatedAt: string | null;
};

type ResolvedPlayerFields = {
  id: number | null;
  name: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export function normalizePlayedAt(dateTime: string) {
  return normalizePlayedAtValue(dateTime);
}

export function sortPlayers(players: Player[]) {
  return players.slice().sort((a, b) => a.name.localeCompare(b.name));
}

function createResolvedPlayer(fields: ResolvedPlayerFields) {
  if (!fields.id || !fields.name || !fields.createdAt || !fields.updatedAt) {
    return null;
  }

  return {
    id: fields.id,
    name: fields.name,
    createdAt: fields.createdAt,
    updatedAt: fields.updatedAt,
  } satisfies Player;
}

export function resolveMatches(rows: ResolvedMatchRow[]) {
  return rows.map((row) => ({
    id: row.gameId,
    playedAt: row.playedAt,
    format: row.format,
    sideAScore: row.sideAScore,
    sideBScore: row.sideBScore,
    winnerSide: row.winnerSide,
    createdAt: row.gameCreatedAt,
    updatedAt: row.gameUpdatedAt,
    sideAPlayers: [
      createResolvedPlayer({
        id: row.sideAPlayer1Id,
        name: row.sideAPlayer1Name,
        createdAt: row.sideAPlayer1CreatedAt,
        updatedAt: row.sideAPlayer1UpdatedAt,
      }),
      createResolvedPlayer({
        id: row.sideAPlayer2Id,
        name: row.sideAPlayer2Name,
        createdAt: row.sideAPlayer2CreatedAt,
        updatedAt: row.sideAPlayer2UpdatedAt,
      }),
    ].filter((player): player is Player => player !== null),
    sideBPlayers: [
      createResolvedPlayer({
        id: row.sideBPlayer1Id,
        name: row.sideBPlayer1Name,
        createdAt: row.sideBPlayer1CreatedAt,
        updatedAt: row.sideBPlayer1UpdatedAt,
      }),
      createResolvedPlayer({
        id: row.sideBPlayer2Id,
        name: row.sideBPlayer2Name,
        createdAt: row.sideBPlayer2CreatedAt,
        updatedAt: row.sideBPlayer2UpdatedAt,
      }),
    ].filter((player): player is Player => player !== null),
  }));
}

export function buildGamePlayerColumns(sideAPlayerIds: number[], sideBPlayerIds: number[]) {
  return {
    sideAPlayer1Id: sideAPlayerIds[0] ?? null,
    sideAPlayer2Id: sideAPlayerIds[1] ?? null,
    sideBPlayer1Id: sideBPlayerIds[0] ?? null,
    sideBPlayer2Id: sideBPlayerIds[1] ?? null,
  };
}

export function normalizePlayerNames(names: string[]) {
  return names.map((rawName) => normalizePlayerName(rawName));
}
