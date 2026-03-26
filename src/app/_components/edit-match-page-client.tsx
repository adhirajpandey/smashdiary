"use client";

import { GameForm } from "@/app/_components/game-form";
import { StatusView } from "@/app/_components/status-view";
import { ApiClientError, useMatchDetailQuery, usePlayersQuery } from "@/lib/api/client";

export function EditMatchPageClient({ matchId }: Readonly<{ matchId: number }>) {
  const matchQuery = useMatchDetailQuery(matchId);
  const playersQuery = usePlayersQuery();

  if (matchQuery.isPending || playersQuery.isPending) {
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

  return <GameForm game={matchQuery.data.match} players={playersQuery.data.players} />;
}
