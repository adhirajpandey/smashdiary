import "server-only";

import { normalizeGameFormErrors } from "@/lib/action-errors";
import type {
  DashboardResponse,
  GameUpsertRequest,
  GameUpsertResponse,
  PlayerDto,
  PlayerStatsResponse,
  ResolvedGameDto,
} from "@/lib/api/contracts";
import { getDashboardMetrics, getPlayerStatsSummary, getTopPerformers } from "@/lib/diary-metrics";
import { isTestMode } from "@/lib/runtime-mode";
import { getGameByIdSqlite, listGamesSqlite, listPlayersSqlite, saveGameSqlite } from "@/lib/store-sqlite";
import type { Player, ResolvedGame } from "@/lib/types";
import { deriveWinnerSide, gameFormSchema } from "@/lib/validation";
import { getGameByIdRepo, listGamesRepo, listPlayersRepo, saveGameRepo } from "@/lib/server/diary-repository";
import { ApiNotFoundError, ApiValidationError } from "@/lib/server/errors";

function toPlayerDto(player: Player): PlayerDto {
  return {
    id: player.id,
    name: player.name,
    createdAt: player.createdAt,
    updatedAt: player.updatedAt,
  };
}

function toResolvedGameDto(game: ResolvedGame): ResolvedGameDto {
  return {
    id: game.id,
    playedAt: game.playedAt,
    format: game.format,
    sideAPlayerIds: game.sideAPlayerIds,
    sideBPlayerIds: game.sideBPlayerIds,
    sideAScore: game.sideAScore,
    sideBScore: game.sideBScore,
    winnerSide: game.winnerSide,
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
    sideAPlayers: game.sideAPlayers.map(toPlayerDto),
    sideBPlayers: game.sideBPlayers.map(toPlayerDto),
  };
}

async function listPlayersInternal() {
  if (isTestMode()) {
    return listPlayersSqlite();
  }

  return listPlayersRepo();
}

async function listGamesInternal() {
  if (isTestMode()) {
    return listGamesSqlite();
  }

  return listGamesRepo();
}

async function getGameByIdInternal(id: string) {
  if (isTestMode()) {
    return getGameByIdSqlite(id);
  }

  return getGameByIdRepo(id);
}

export async function listPlayersService() {
  const players = await listPlayersInternal();
  return players.map(toPlayerDto);
}

export async function listGamesService(playerId?: string, limit?: number) {
  const games = await listGamesInternal();
  const filteredGames = playerId
    ? games.filter(
        (game) =>
          game.sideAPlayers.some((player) => player.id === playerId) ||
          game.sideBPlayers.some((player) => player.id === playerId),
      )
    : games;

  return (typeof limit === "number" ? filteredGames.slice(0, limit) : filteredGames).map(toResolvedGameDto);
}

export async function getGameByIdService(id: string) {
  const game = await getGameByIdInternal(id);
  if (!game) {
    throw new ApiNotFoundError("Match record not found.");
  }

  return toResolvedGameDto(game);
}

export async function upsertGameService(payload: GameUpsertRequest, id?: string): Promise<GameUpsertResponse> {
  const parsed = gameFormSchema.safeParse(payload);
  if (!parsed.success) {
    const normalized = normalizeGameFormErrors(parsed.error);
    throw new ApiValidationError(normalized.formError, normalized.fieldErrors);
  }

  const input = {
    id,
    ...parsed.data,
    winnerSide: deriveWinnerSide(parsed.data.sideAScore, parsed.data.sideBScore),
  };

  const savedId = isTestMode() ? await saveGameSqlite(input) : await saveGameRepo(input);
  if (!savedId) {
    throw new ApiNotFoundError("Match record not found.");
  }

  return { id: savedId };
}

export async function getDashboardService(playerId: string): Promise<DashboardResponse> {
  const [games, players] = await Promise.all([listGamesInternal(), listPlayersInternal()]);

  return {
    metrics: (() => {
      const metrics = getDashboardMetrics(games, players, playerId);
      if (!metrics) {
        return null;
      }

      return {
        ...metrics,
        recentMatches: metrics.recentMatches.map(toResolvedGameDto),
      };
    })(),
    topPerformers: getTopPerformers(games, players),
  };
}

export async function getPlayerStatsService(playerId: string): Promise<PlayerStatsResponse> {
  const [games, players] = await Promise.all([listGamesInternal(), listPlayersInternal()]);
  return getPlayerStatsSummary(games, players, playerId);
}
