"use client";

import { useSearchParams } from "next/navigation";

import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { buildCloneMatchSeed } from "@/lib/clone-match";
import { GameForm } from "@/app/_components/game-form";
import { StatusView } from "@/app/_components/status-view";
import { ApiClientError, useMatchDetailQuery, usePlayersQuery } from "@/lib/api/client";
import { parseNumericId } from "@/lib/utils";

export function NewMatchPageClient() {
  const searchParams = useSearchParams();
  const { isHydrated, selectedPlayerId } = useSelectedPlayer();
  const cloneFrom = parseNumericId(searchParams.get("cloneFrom") ?? "");
  const cloneQuery = useMatchDetailQuery(cloneFrom, cloneFrom !== null && isHydrated);
  const { data, error, isPending } = usePlayersQuery();
  const isClonePending = cloneFrom !== null && (!isHydrated || cloneQuery.isPending);

  if (isPending || isClonePending) {
    return (
      <StatusView
        eyebrow="Loading"
        title="Loading match form"
        description={cloneFrom ? "Pulling player suggestions and the match you want to copy." : "Pulling player suggestions for a new entry."}
      />
    );
  }

  if (error) {
    return <StatusView eyebrow="System fault" title="Could not load match form" description={error.message} />;
  }

  const cloneSeed = cloneQuery.data ? buildCloneMatchSeed(cloneQuery.data.match, selectedPlayerId) : undefined;
  const cloneError =
    cloneFrom !== null && cloneQuery.error
      ? cloneQuery.error instanceof ApiClientError && cloneQuery.error.code === "NOT_FOUND"
        ? "Could not load that match to clone. Starting with a fresh entry instead."
        : "Could not load the source match. Starting with a fresh entry instead."
      : null;

  return <GameForm cloneError={cloneError} cloneSeed={cloneSeed} players={data.players} />;
}
