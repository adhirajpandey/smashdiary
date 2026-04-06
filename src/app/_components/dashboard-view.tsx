"use client";

import Link from "next/link";

import { LeaderboardPanel } from "@/app/_components/leaderboard-panel";
import { MatchFeed } from "@/app/_components/match-feed";
import { StatsFormatSelector } from "@/app/_components/stats-format-selector";
import { SummaryStatTile } from "@/app/_components/summary-stat-tile";
import type { LeaderboardData, PlayerDashboardMetrics, StatsFormat } from "@/lib/types";
import { formatStatsFormatLabel } from "@/lib/utils";
import type { MatchFeedItem } from "@/lib/view-models";

function formatPercent(value: number) {
  return `${Math.round(value * 10)}%`;
}

export function DashboardView({
  format,
  hasSelectedPlayer,
  leaderboard,
  metrics,
  recentMatches,
}: Readonly<{
  format: StatsFormat;
  hasSelectedPlayer: boolean;
  leaderboard: LeaderboardData;
  metrics: PlayerDashboardMetrics | null;
  recentMatches: MatchFeedItem[];
}>) {
  const formatLabel = formatStatsFormatLabel(format);

  return (
    <>
      <Link className="quick-log" href="/matches/new">
        <span className="quick-log__icon">+</span>
        <span>Add a Match</span>
      </Link>

      <StatsFormatSelector />

      {metrics ? (
        <>
          <section className="dashboard-grid">
            <SummaryStatTile accent="primary" label="Win rate" value={formatPercent(metrics.winScore)} />
            <SummaryStatTile accent="secondary" label="Player rating" value={metrics.playerRating.toFixed(1)} />
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-section__title">{formatLabel} activity</h2>
            <div className="activity-list">
              <div className="activity-list__row">
                <span>{formatLabel} matches</span>
                <strong>{metrics.totalMatches}</strong>
              </div>
              <div className="activity-list__row">
                <span>Wins-Losses</span>
                <strong>{`${metrics.wins}-${metrics.losses}`}</strong>
              </div>
            </div>
          </section>

          <section className="dashboard-section">
            <div className="dashboard-section__row">
              <h2 className="dashboard-section__title">{formatLabel} matches</h2>
              <Link className="dashboard-link" href="/matches">
                View all
              </Link>
            </div>
            <MatchFeed matches={recentMatches} />
          </section>
        </>
      ) : (
        <section className="dashboard-empty">
          <p className="dashboard-empty__title">
            {hasSelectedPlayer ? `No ${format} matches yet` : "Player context needed"}
          </p>
          <p className="muted-copy">
            {hasSelectedPlayer
              ? `Choose or log a ${format} match to unlock win rate, rating, and recent activity.`
              : `Pick a player from the header to load personal ${format} activity.`}
          </p>
        </section>
      )}

      <LeaderboardPanel leaderboard={leaderboard} />
    </>
  );
}
