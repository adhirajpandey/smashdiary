"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import type { GameFormFieldErrors } from "@/lib/action-errors";
import type { ApiResponse, MatchMutationInput, MatchMutationResult } from "@/lib/api/contracts";
import type { DashboardData, MatchDetailData, MatchesData, PlayersData, StatsData } from "@/lib/view-models";

export class ApiClientError extends Error {
  code: string;
  formError?: string;
  fieldErrors?: GameFormFieldErrors;

  constructor(message: string, code: string, formError?: string, fieldErrors?: GameFormFieldErrors) {
    super(message);
    this.code = code;
    this.formError = formError;
    this.fieldErrors = fieldErrors;
  }
}

export const queryKeys = {
  players: ["players"] as const,
  dashboard: (playerId: number | null) => ["dashboard", playerId] as const,
  matches: (playerId: number | null) => ["matches", playerId] as const,
  matchDetail: (matchId: number) => ["matches", matchId] as const,
  stats: (playerId: number | null) => ["stats", playerId] as const,
};

async function invalidateDiaryQueries(queryClient: QueryClient, matchId?: number) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.players }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["matches"] }),
    queryClient.invalidateQueries({ queryKey: ["stats"] }),
    ...(matchId ? [queryClient.invalidateQueries({ queryKey: queryKeys.matchDetail(matchId) })] : []),
  ]);
}

async function clearDeletedMatchQueries(queryClient: QueryClient, matchId: number) {
  await Promise.all([
    invalidateDiaryQueries(queryClient),
    queryClient.removeQueries({ queryKey: queryKeys.matchDetail(matchId) }),
  ]);
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const body = (await response.json()) as ApiResponse<T>;

  if ("error" in body) {
    throw new ApiClientError(
      body.error.message ?? body.error.formError ?? "Request failed.",
      body.error.code,
      body.error.formError,
      body.error.fieldErrors,
    );
  }

  return body.data;
}

export function usePlayersQuery() {
  return useQuery({
    queryKey: queryKeys.players,
    queryFn: () => fetchJson<PlayersData>("/api/players"),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}

export function useDashboardQuery(playerId: number | null) {
  return useQuery({
    queryKey: queryKeys.dashboard(playerId),
    queryFn: () => fetchJson<DashboardData>(playerId ? `/api/dashboard?playerId=${playerId}` : "/api/dashboard"),
    placeholderData: (previousData) => previousData,
  });
}

export function useMatchesQuery(playerId: number | null) {
  return useQuery({
    queryKey: queryKeys.matches(playerId),
    queryFn: () => fetchJson<MatchesData>(playerId ? `/api/matches?playerId=${playerId}` : "/api/matches"),
    placeholderData: (previousData) => previousData,
  });
}

export function useMatchDetailQuery(matchId: number) {
  return useQuery({
    queryKey: queryKeys.matchDetail(matchId),
    queryFn: () => fetchJson<MatchDetailData>(`/api/matches/${matchId}`),
    placeholderData: (previousData) => previousData,
  });
}

export function useStatsQuery(playerId: number | null) {
  return useQuery({
    queryKey: queryKeys.stats(playerId),
    queryFn: () => fetchJson<StatsData>(playerId ? `/api/stats?playerId=${playerId}` : "/api/stats"),
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateMatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MatchMutationInput) =>
      fetchJson<MatchMutationResult>("/api/matches", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => invalidateDiaryQueries(queryClient),
  });
}

export function useUpdateMatchMutation(matchId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: MatchMutationInput) =>
      fetchJson<MatchMutationResult>(`/api/matches/${matchId}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    onSuccess: async () => invalidateDiaryQueries(queryClient, matchId),
  });
}

export function useDeleteMatchMutation(matchId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<MatchMutationResult>(`/api/matches/${matchId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => clearDeletedMatchQueries(queryClient, matchId),
  });
}
