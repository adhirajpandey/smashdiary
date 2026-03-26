import { normalizeGameFormErrors, type NormalizedGameFormErrors } from "@/lib/action-errors";
import { saveMatch } from "@/lib/commands/save-match";
import { deriveWinnerSide, gameFormSchema } from "@/lib/validation";

type SaveMatchResult =
  | { ok: true; id: number }
  | { ok: false; errors: NormalizedGameFormErrors };

export async function saveMatchFromJson(input: unknown, id?: number): Promise<SaveMatchResult> {
  const parsed = gameFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: normalizeGameFormErrors(parsed.error),
    };
  }

  try {
    const savedId = await saveMatch({
      id,
      ...parsed.data,
      winnerSide: deriveWinnerSide(parsed.data.sideAScore, parsed.data.sideBScore),
    });

    return { ok: true, id: savedId };
  } catch {
    return {
      ok: false,
      errors: {
        formError: "Could not save game. Please try again.",
        fieldErrors: {},
      },
    };
  }
}
