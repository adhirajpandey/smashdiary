"use client";

import { StatsPanel } from "@/app/_components/stats-panel";
import { StatusView } from "@/app/_components/status-view";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { useStatsFormat } from "@/app/_components/stats-format-provider";
import { useStatsQuery } from "@/lib/api/client";

export function StatsPageClient() {
  const { isHydrated, selectedPlayerId } = useSelectedPlayer();
  const { isHydrated: isStatsFormatHydrated, selectedStatsFormat } = useStatsFormat();
  const { data, error, isPending } = useStatsQuery(selectedPlayerId, selectedStatsFormat);

  if (!isHydrated || !isStatsFormatHydrated || isPending) {
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

  return <StatsPanel format={data.format} hasSelectedPlayer={selectedPlayerId !== null} leaderboard={data.leaderboard} metrics={data.metrics} summary={data.summary} />;
}
