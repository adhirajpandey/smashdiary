"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { UpsertGameActionState } from "@/app/action-state";
import { normalizeGameFormErrors } from "@/lib/action-errors";
import { saveGame } from "@/lib/store";
import { deriveWinnerSide, gameFormSchema } from "@/lib/validation";

function collectPlayers(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function upsertGameAction(_: UpsertGameActionState, formData: FormData): Promise<UpsertGameActionState> {
  const id = String(formData.get("id") ?? "").trim() || undefined;

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

  let savedGameId = id ?? "";
  try {
    savedGameId = await saveGame({
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
