import { normalizeGameFormErrors, type NormalizedGameFormErrors } from "@/lib/action-errors";
import { saveMatch } from "@/lib/commands/save-match";
import { logger } from "@/lib/logger";
import { MatchNotFoundError } from "@/lib/match-errors";
import { deriveWinnerSide, gameFormSchema } from "@/lib/validation";

export type SaveMatchResult =
  | { type: "success"; id: number }
  | { type: "validation_error"; errors: NormalizedGameFormErrors }
  | { type: "not_found"; message: string }
  | { type: "internal_error"; message: string };

export async function saveMatchFromJson(input: unknown, id?: number): Promise<SaveMatchResult> {
  const parsed = gameFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      type: "validation_error",
      errors: normalizeGameFormErrors(parsed.error),
    };
  }

  try {
    const savedId = await saveMatch({
      id,
      ...parsed.data,
      winnerSide: deriveWinnerSide(parsed.data.sideAScore, parsed.data.sideBScore),
    });

    return { type: "success", id: savedId };
  } catch (error) {
    if (error instanceof MatchNotFoundError) {
      return {
        type: "not_found",
        message: error.message,
      };
    }

    logger.error("save-match", "save_failed", { id, error });

    return {
      type: "internal_error",
      message: "Could not save match. Please try again.",
    };
  }
}
