"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { MatchMutationInput, MatchMutationResult } from "@/lib/api/contracts";
import { fetchJson } from "@/lib/api/fetch-json";
import { apiQueryKeyRoots, apiRoutes, queryKeys } from "@/lib/config/api";
import type { StatsFormat } from "@/lib/types";
import type { DashboardData, MatchDetailData, MatchesData, PlayersData, StatsData } from "@/lib/view-models";

export { ApiClientError } from "@/lib/api/fetch-json";
export { queryKeys };

async function invalidateDiaryQueries(queryClient: QueryClient, matchId?: number) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.players }),
    queryClient.invalidateQueries({ queryKey: [apiQueryKeyRoots.dashboard] }),
    queryClient.invalidateQueries({ queryKey: [apiQueryKeyRoots.matches] }),
    queryClient.invalidateQueries({ queryKey: [apiQueryKeyRoots.stats] }),
    ...(matchId ? [queryClient.invalidateQueries({ queryKey: queryKeys.matchDetail(matchId) })] : []),
  ]);
}

async function clearDeletedMatchQueries(queryClient: QueryClient, matchId: number) {
  await Promise.all([
    invalidateDiaryQueries(queryClient),
    queryClient.removeQueries({ queryKey: queryKeys.matchDetail(matchId) }),
  ]);
}

export function invalidateDiaryQueriesInBackground(queryClient: QueryClient, matchId?: number) {
  void invalidateDiaryQueries(queryClient, matchId).catch((error: unknown) => {
    console.error("Failed to invalidate diary queries after match save.", error);
  });
}

export function usePlayersQuery() {
  return useQuery({
    queryKey: queryKeys.players,
    queryFn: () => fetchJson<PlayersData>(apiRoutes.players),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}

export function useDashboardQuery(playerId: number | null, format: StatsFormat) {
  return useQuery({
    queryKey: queryKeys.dashboard(playerId, format),
    queryFn: () => fetchJson<DashboardData>(apiRoutes.dashboard(playerId, format)),
    placeholderData: (previousData) => previousData,
  });
}

export function useMatchesQuery(playerId: number | null, format: StatsFormat) {
  return useQuery({
    queryKey: queryKeys.matches(playerId, format),
    queryFn: () => fetchJson<MatchesData>(apiRoutes.matchesList(playerId, format)),
    placeholderData: (previousData) => previousData,
  });
}

export function useMatchDetailQuery(matchId: number | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.matchDetail(matchId),
    queryFn: () => fetchJson<MatchDetailData>(apiRoutes.matchDetail(matchId!)),
    enabled: enabled && matchId !== null,
    placeholderData: (previousData) => previousData,
  });
}

export function useStatsQuery(playerId: number | null, format: StatsFormat) {
  return useQuery({
    queryKey: queryKeys.stats(playerId, format),
    queryFn: () => fetchJson<StatsData>(apiRoutes.stats(playerId, format)),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MatchMutationInput) =>
      fetchJson<MatchMutationResult>(apiRoutes.matches, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateDiaryQueriesInBackground(queryClient),
  });
}

export function useUpdateMatchMutation(matchId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MatchMutationInput) =>
      fetchJson<MatchMutationResult>(apiRoutes.matchDetail(matchId), {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidateDiaryQueriesInBackground(queryClient, matchId),
  });
}

export function useDeleteMatchMutation(matchId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<MatchMutationResult>(apiRoutes.matchDetail(matchId), {
        method: "DELETE",
      }),
    onSuccess: async () => clearDeletedMatchQueries(queryClient, matchId),
  });
}
