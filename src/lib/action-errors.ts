import type { z } from "zod";

const GAME_FORM_FIELDS = [
  "playedAt",
  "format",
  "sideAScore",
  "sideBScore",
  "sideAPlayers",
  "sideBPlayers",
] as const;

type GameFormField = (typeof GAME_FORM_FIELDS)[number];

export type GameFormFieldErrors = Partial<Record<GameFormField, string>>;

export type NormalizedGameFormErrors = {
  formError: string;
  fieldErrors: GameFormFieldErrors;
};

function isGameFormField(value: string): value is GameFormField {
  return (GAME_FORM_FIELDS as readonly string[]).includes(value);
}

export function normalizeGameFormErrors(error: z.ZodError): NormalizedGameFormErrors {
  const fieldErrors: GameFormFieldErrors = {};
  let formError = "Please fix the highlighted input and try again.";

  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (isGameFormField(key) && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
      continue;
    }

    if (!issue.path.length && formError === "Please fix the highlighted input and try again.") {
      formError = issue.message;
    }
  }

  if (Object.keys(fieldErrors).length) {
    formError = "Please fix the highlighted input and try again.";
  }

  return { formError, fieldErrors };
}

