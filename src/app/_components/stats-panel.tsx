"use client";

import { LeaderboardPanel } from "@/app/_components/leaderboard-panel";
import { SectionHeading } from "@/app/_components/section-heading";
import { StatsFormatSelector } from "@/app/_components/stats-format-selector";
import { SummaryStatTile } from "@/app/_components/summary-stat-tile";
import type { LeaderboardData, PlayerDashboardMetrics, PlayerStatsSummary, StatsFormat } from "@/lib/types";
import { formatStatsFormatLabel } from "@/lib/utils";

function formatPercent(value: number) {
  return `${Math.round(value * 10)}%`;
}

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

        <div className="stats-page__empty">
          <p className="stats-page__empty-title">{hasSelectedPlayer ? `No ${format} stats yet` : "Player context needed"}</p>
          <p className="muted-copy">
            {hasSelectedPlayer
              ? `Log a ${format} match to unlock personal win rate and rating for this format.`
              : `Pick a player from the header to load personal ratings and results breakdown.`}
          </p>
        </div>

        <LeaderboardPanel leaderboard={leaderboard} />
      </section>
    );
  }

  return (
    <section className="stats-page">
      <StatsFormatSelector />

      <div className="stats-page__header">
        <SectionHeading
          eyebrow="Stats"
          title={`${summary.playerName}'s ${format} stats`}
          description={`${summary.totalMatches} ${format} matches on record.`}
          titleClassName="page-title stats-page__title"
        />
      </div>

      <section className="dashboard-grid stats-page__metrics">
        <SummaryStatTile accent="primary" label="Win rate" value={formatPercent(metrics.winScore)} />
        <SummaryStatTile accent="secondary" label="Player rating" value={metrics.playerRating.toFixed(1)} />
      </section>

      <section className="stats-results">
        <div className="dashboard-section__row">
          <h2 className="dashboard-section__title">{formatLabel} breakdown</h2>
          <p className="stats-results__meta">{summary.totalMatches} matches</p>
        </div>

        <div className="stats-results__grid">
          <div className="stats-results__card">
            <span className="stats-results__label">Matches</span>
            <strong className="display stats-results__value">{summary.totalMatches}</strong>
          </div>
          <div className="stats-results__card">
            <span className="stats-results__label">Wins-Losses</span>
            <strong className="display stats-results__value stats-results__value--secondary">{`${summary.wins}-${summary.losses}`}</strong>
          </div>
          <div className="stats-results__card">
            <span className="stats-results__label">Wins</span>
            <strong className="display stats-results__value stats-results__value--primary">{summary.wins}</strong>
          </div>
          <div className="stats-results__card">
            <span className="stats-results__label">Losses</span>
            <strong className="display stats-results__value stats-results__value--danger">{summary.losses}</strong>
          </div>
        </div>
      </section>

      <LeaderboardPanel leaderboard={leaderboard} />
    </section>
  );
}
