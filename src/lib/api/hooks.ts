"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  DashboardResponse,
  GameUpsertRequest,
  GameUpsertResponse,
  PlayerDto,
  PlayerStatsResponse,
  ResolvedGameDto,
} from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function usePlayersQuery() {
  return useQuery({
    queryKey: queryKeys.players(),
    queryFn: () => fetchJson<PlayerDto[]>("/api/players"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGamesQuery(playerId?: string | null, limit?: number) {
  return useQuery({
    queryKey: queryKeys.games(playerId, limit),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (playerId) {
        searchParams.set("playerId", playerId);
      }
      if (typeof limit === "number") {
        searchParams.set("limit", String(limit));
      }
      const suffix = searchParams.toString();
      return fetchJson<ResolvedGameDto[]>(suffix ? `/api/games?${suffix}` : "/api/games");
    },
    enabled: playerId !== null,
  });
}

export function useGameQuery(id: string) {
  return useQuery({
    queryKey: queryKeys.game(id),
    queryFn: () => fetchJson<ResolvedGameDto>(`/api/games/${id}`),
    enabled: Boolean(id),
  });
}

export function useDashboardQuery(playerId?: string | null) {
  return useQuery({
    queryKey: queryKeys.dashboard(playerId),
    queryFn: () => fetchJson<DashboardResponse>(`/api/dashboard/${playerId}`),
    enabled: Boolean(playerId),
  });
}

export function useStatsQuery(playerId?: string | null) {
  return useQuery({
    queryKey: queryKeys.stats(playerId),
    queryFn: () => fetchJson<PlayerStatsResponse>(`/api/stats/${playerId}`),
    enabled: Boolean(playerId),
  });
}

function invalidateMatchQueries(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["players"] }),
    queryClient.invalidateQueries({ queryKey: ["games"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["stats"] }),
    ...(id ? [queryClient.invalidateQueries({ queryKey: queryKeys.game(id) })] : []),
  ]);
}

export function useCreateGameMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GameUpsertRequest) =>
      fetchJson<GameUpsertResponse>("/api/games", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: async (result) => {
      queryClient.setQueryData(queryKeys.lastSavedGame(), result.id);
      await invalidateMatchQueries(queryClient, result.id);
    },
  });
}

export function useUpdateGameMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GameUpsertRequest) =>
      fetchJson<GameUpsertResponse>(`/api/games/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: async (result) => {
      queryClient.setQueryData(queryKeys.lastSavedGame(), result.id);
      await invalidateMatchQueries(queryClient, id);
    },
  });
}

export function useDeleteGameMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<void>(`/api/games/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: queryKeys.game(id) });
      await invalidateMatchQueries(queryClient);
    },
  });
}
