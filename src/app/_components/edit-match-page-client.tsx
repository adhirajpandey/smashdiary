"use client";

import { GameForm } from "@/app/_components/game-form";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { StatusView } from "@/app/_components/status-view";
import { ApiClientError, useMatchDetailQuery, usePlayersQuery } from "@/lib/api/client";
import { buildGameFormSeed } from "@/lib/game-form-seed";

export function EditMatchPageClient({ matchId }: Readonly<{ matchId: number }>) {
  const { isHydrated, selectedPlayerId } = useSelectedPlayer();
  const matchQuery = useMatchDetailQuery(matchId);
  const playersQuery = usePlayersQuery();

  if (!isHydrated || matchQuery.isPending || playersQuery.isPending) {
    return (
      <StatusView
        eyebrow="Loading"
        title="Loading match editor"
        description="Pulling the saved match and player suggestions."
      />
    );
  }

  if (matchQuery.error instanceof ApiClientError && matchQuery.error.code === "NOT_FOUND") {
    return (
      <StatusView
        eyebrow="404"
        title="This court is empty"
        description="That page does not exist or the match record could not be found."
      />
    );
  }

  if (matchQuery.error || playersQuery.error) {
    return (
      <StatusView
        eyebrow="System fault"
        title="Could not load match editor"
        description={matchQuery.error?.message ?? playersQuery.error?.message}
      />
    );
  }

  const initialSeed = buildGameFormSeed(matchQuery.data.match, selectedPlayerId);

  return <GameForm initialSeed={initialSeed} matchId={matchId} players={playersQuery.data.players} />;
}
