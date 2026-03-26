import type { Game, GameParticipant, Player, ResolvedGame } from "@/lib/types";
import { normalizePlayedAtValue, normalizePlayerName, normalizePlayerNameKey } from "@/lib/utils";

export type ResolvedMatchRow = {
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

export function normalizePlayedAt(dateTime: string) {
  return normalizePlayedAtValue(dateTime);
}

export function sortPlayers(players: Player[]) {
  return players.slice().sort((a, b) => {
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

export function resolveMatches(rows: ResolvedMatchRow[]) {
  const resolvedById = new Map<number, ResolvedGame>();

  for (const row of rows) {
    let match = resolvedById.get(row.gameId);
    if (!match) {
      match = {
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
      resolvedById.set(row.gameId, match);
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
      match.sideAPlayers.push(player);
    } else {
      match.sideBPlayers.push(player);
    }
  }

  return Array.from(resolvedById.values());
}

export function buildParticipantValues(gameId: number, sideAPlayerIds: number[], sideBPlayerIds: number[], createdAt: string) {
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

export function normalizePlayerNames(names: string[]) {
  return names.map((rawName) => ({
    name: normalizePlayerName(rawName),
    nameKey: normalizePlayerNameKey(rawName),
  }));
}
