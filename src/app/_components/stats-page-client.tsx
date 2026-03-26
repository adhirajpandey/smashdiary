"use client";

import { StatsPanel } from "@/app/_components/stats-panel";
import { StatusView } from "@/app/_components/status-view";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { useStatsQuery } from "@/lib/api/client";

export function StatsPageClient() {
  const { isHydrated, selectedPlayerId } = useSelectedPlayer();
  const { data, error, isPending } = useStatsQuery(selectedPlayerId);

  if (!isHydrated || isPending) {
    return (
      <StatusView
        eyebrow="Loading"
        title="Loading stats"
        description="Building the latest ratings and records."
      />
    );
  }

  if (error) {
    return <StatusView eyebrow="System fault" title="Could not load stats" description={error.message} />;
  }

  return <StatsPanel leaderboard={data.leaderboard} metrics={data.metrics} summary={data.summary} />;
}
