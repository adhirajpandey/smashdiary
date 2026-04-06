"use client";

import { LeaderboardPanel } from "@/app/_components/leaderboard-panel";
import { SectionHeading } from "@/app/_components/section-heading";
import { StatsPerformancePanel } from "@/app/_components/stats-performance-panel";
import { StatsFormatSelector } from "@/app/_components/stats-format-selector";
import type { LeaderboardData, PlayerDashboardMetrics, PlayerStatsSummary, StatsFormat } from "@/lib/types";
import { formatStatsFormatLabel } from "@/lib/utils";

export function StatsPanel({
  format,
  hasSelectedPlayer,
  leaderboard,
  metrics,
  summary,
}: Readonly<{
  format: StatsFormat;
  hasSelectedPlayer: boolean;
  leaderboard: LeaderboardData;
  metrics: PlayerDashboardMetrics | null;
  summary: PlayerStatsSummary | null;
}>) {
  const formatLabel = formatStatsFormatLabel(format);

  if (!summary || !metrics) {
    return (
      <section className="stats-page">
        <div className="stats-page__top">
          <StatsFormatSelector />

          <div className="stats-page__header">
            <SectionHeading
              eyebrow="Stats"
              title={`${formatLabel} stats`}
              description={
                hasSelectedPlayer
                  ? `No ${format} matches yet for the selected player.`
                  : `Choose a player to load ${format} ratings, records, and leaderboard context.`
              }
              titleClassName="page-title stats-page__title"
            />
          </div>
        </div>

        <div className="stats-page__empty">
          <p className="stats-page__empty-title">{hasSelectedPlayer ? `No ${format} stats yet` : "Player context needed"}</p>
          <p className="muted-copy">
            {hasSelectedPlayer
              ? `Log a ${format} match to unlock personal win rate and rating for this format.`
              : `Pick a player from the header to load personal performance and leaderboard context.`}
          </p>
        </div>

        <LeaderboardPanel leaderboard={leaderboard} />
      </section>
    );
  }

  return (
    <section className="stats-page">
      <div className="stats-page__top">
        <StatsFormatSelector />

        <div className="stats-page__header">
          <SectionHeading
            eyebrow="Stats"
            title={`${summary.playerName}'s ${format} stats`}
            description={`${summary.totalMatches} ${format} matches`}
            titleClassName="page-title stats-page__title"
          />
        </div>

        <StatsPerformancePanel key={format} metrics={metrics} summary={summary} />
      </div>

      <LeaderboardPanel leaderboard={leaderboard} />
    </section>
  );
}
