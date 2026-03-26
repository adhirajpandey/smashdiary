"use client";

import { MatchesView } from "@/app/_components/matches-view";
import { StatusView } from "@/app/_components/status-view";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { useMatchesQuery } from "@/lib/api/client";

export function MatchesPageClient() {
  const { isHydrated, selectedPlayerId } = useSelectedPlayer();
  const { data, error, isPending } = useMatchesQuery(selectedPlayerId);

  if (!isHydrated || isPending) {
    return (
      <StatusView
        eyebrow="Loading"
        title="Loading matches"
        description="Pulling the selected player's history."
      />
    );
  }

  if (error) {
    return <StatusView eyebrow="System fault" title="Could not load matches" description={error.message} />;
  }

  return <MatchesView matches={data.matches} selectedPlayerName={data.selectedPlayerName} />;
}
