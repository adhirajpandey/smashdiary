"use client";

import Link from "next/link";

import { LeaderboardPanel } from "@/app/_components/leaderboard-panel";
import { MatchFeed } from "@/app/_components/match-feed";
import { SummaryStatTile } from "@/app/_components/summary-stat-tile";
import type { PlayerDashboardMetrics, PlayerStanding } from "@/lib/types";
import type { MatchFeedItem } from "@/lib/view-models";

function formatPercent(value: number) {
  return `${Math.round(value * 10)}%`;
}

export function DashboardView({
  leaderboard,
  metrics,
  recentMatches,
}: Readonly<{
  leaderboard: PlayerStanding[];
  metrics: PlayerDashboardMetrics | null;
  recentMatches: MatchFeedItem[];
}>) {
  if (!metrics) {
    return null;
  }

  return (
    <>
      <Link className="quick-log" href="/matches/new">
        <span className="quick-log__icon">+</span>
        <span>Add a Match</span>
      </Link>

      <section className="dashboard-grid">
        <SummaryStatTile accent="primary" label="Win rate" value={formatPercent(metrics.winScore)} />
        <SummaryStatTile accent="secondary" label="Player rating" value={metrics.playerRating.toFixed(1)} />
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section__title">Your Activity</h2>
        <div className="activity-list">
          <div className="activity-list__row">
            <span>Singles Matches</span>
            <strong>{metrics.singlesGames}</strong>
          </div>
          <div className="activity-list__row">
            <span>Doubles Matches</span>
            <strong>{metrics.doublesGames}</strong>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__row">
          <h2 className="dashboard-section__title">Recent Matches</h2>
          <Link className="dashboard-link" href="/matches">
            View all
          </Link>
        </div>
        <MatchFeed matches={recentMatches} />
      </section>

      <LeaderboardPanel players={leaderboard} />
    </>
  );
}
