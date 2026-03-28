import type { GameFormFieldErrors } from "@/lib/action-errors";
import type { MatchSlot, ResolvedGame } from "@/lib/types";

export type ApiErrorCode = "INTERNAL_ERROR" | "NOT_FOUND" | "VALIDATION_ERROR";

export type ApiError = {
  code: ApiErrorCode;
  message?: string;
  formError?: string;
  fieldErrors?: GameFormFieldErrors;
};

export type ApiResponse<T> = { data: T } | { error: ApiError };

export type MatchMutationInput = {
  playedOn: string;
  slot: MatchSlot;
  format: ResolvedGame["format"];
  sideAPlayers: string[];
  sideBPlayers: string[];
  sideAScore: number;
  sideBScore: number;
};

export type MatchMutationResult = {
  id: number;
};
