"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { UpsertGameActionState } from "@/app/action-state";
import { normalizeGameFormErrors } from "@/lib/action-errors";
import { saveMatch } from "@/lib/commands/save-match";
import { parseNumericId } from "@/lib/utils";
import { deriveWinnerSide, gameFormSchema } from "@/lib/validation";

function collectPlayers(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function upsertGameAction(_: UpsertGameActionState, formData: FormData): Promise<UpsertGameActionState> {
  const rawId = String(formData.get("id") ?? "").trim();
  const parsedId = rawId ? parseNumericId(rawId) : null;
  const id = parsedId ?? undefined;

  if (rawId && !parsedId) {
    return {
      formError: "Could not save game. Please try again.",
      fieldErrors: {},
    };
  }

  const parsed = gameFormSchema.safeParse({
    playedAt: String(formData.get("playedAt") ?? ""),
    format: String(formData.get("format") ?? "singles"),
    sideAScore: formData.get("sideAScore"),
    sideBScore: formData.get("sideBScore"),
    sideAPlayers: collectPlayers(formData, "sideAPlayers"),
    sideBPlayers: collectPlayers(formData, "sideBPlayers"),
  });

  if (!parsed.success) {
    const normalized = normalizeGameFormErrors(parsed.error);
    return normalized;
  }

  let savedGameId = id ?? 0;
  try {
    savedGameId = await saveMatch({
      id,
      ...parsed.data,
      winnerSide: deriveWinnerSide(parsed.data.sideAScore, parsed.data.sideBScore),
    });
  } catch {
    return {
      formError: "Could not save game. Please try again.",
      fieldErrors: {},
    };
  }

  revalidatePath("/");
  revalidatePath("/matches");
  revalidatePath("/matches/new");
  revalidatePath("/stats");
  if (id) {
    revalidatePath(`/matches/${id}`);
  }
  redirect(`/?savedGameId=${encodeURIComponent(savedGameId)}`);
}
