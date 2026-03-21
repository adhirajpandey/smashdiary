"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteGame, saveGame } from "@/lib/store";
import { deriveWinnerSide, gameFormSchema } from "@/lib/validation";

function collectPlayers(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function upsertGameAction(formData: FormData) {
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
    throw new Error(parsed.error.issues[0]?.message ?? "Could not save game.");
  }

  await saveGame({
    id,
    ...parsed.data,
    winnerSide: deriveWinnerSide(parsed.data.sideAScore, parsed.data.sideBScore),
  });

  revalidatePath("/");
  revalidatePath("/matches");
  revalidatePath("/matches/new");
  revalidatePath("/stats");
  if (id) {
    revalidatePath(`/matches/${id}`);
  }
  redirect("/");
}

export async function deleteGameAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) {
    throw new Error("Missing game id.");
  }

  await deleteGame(id);
  revalidatePath("/");
  revalidatePath("/matches");
  revalidatePath("/stats");
  redirect("/");
}
