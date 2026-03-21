import type { GameFormFieldErrors } from "@/lib/action-errors";

export type UpsertGameActionState = {
  formError: string | null;
  fieldErrors: GameFormFieldErrors;
};

export const initialUpsertGameActionState: UpsertGameActionState = {
  formError: null,
  fieldErrors: {},
};
