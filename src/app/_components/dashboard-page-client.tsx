"use client";

import { DashboardView } from "@/app/_components/dashboard-view";
import { StatusView } from "@/app/_components/status-view";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { useDashboardQuery } from "@/lib/api/client";

export function DashboardPageClient() {
  const { isHydrated, selectedPlayerId } = useSelectedPlayer();
  const { data, error, isPending } = useDashboardQuery(selectedPlayerId);

  if (!isHydrated || isPending) {
    return (
      <StatusView
        eyebrow="Loading"
        title="Loading dashboard"
        description="Pulling your latest match metrics and leaderboard."
      />
    );
  }

  if (error) {
    return <StatusView eyebrow="System fault" title="Could not load dashboard" description={error.message} />;
  }

  return (
    <DashboardView
      leaderboard={data.leaderboard}
      metrics={data.metrics}
      recentMatches={data.recentMatches}
    />
  );
}
