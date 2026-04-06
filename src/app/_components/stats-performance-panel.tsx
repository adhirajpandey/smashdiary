"use client";

import { cn } from "@/lib/utils";
import type { PlayerDashboardMetrics, PlayerStatsSummary } from "@/lib/types";

function formatPercent(value: number) {
  return `${Math.round(value * 10)}%`;
}

function formatSignedValue(value: number) {
  if (value > 0) {
    return `+${value.toFixed(1)}`;
  }

  if (value < 0) {
    return value.toFixed(1);
  }

  return "0.0";
}

function getSplitWidth(value: number, total: number) {
  if (!total) {
    return "0%";
  }

  return `${(value / total) * 100}%`;
}

export function StatsPerformancePanel({
  metrics,
  summary,
}: Readonly<{
  metrics: PlayerDashboardMetrics;
  summary: PlayerStatsSummary;
}>) {
  const averagePointDiffAccent =
    metrics.averagePointDiff > 0
      ? "stats-performance__support-value--primary"
      : metrics.averagePointDiff < 0
        ? "stats-performance__support-value--danger"
        : "stats-performance__support-value--secondary";

  return (
    <section className="stats-performance">
      <div className="stats-performance__header">
        <p className="stats-performance__kicker">Performance</p>
      </div>

      <div className="stats-performance__top">
        <div className="stats-performance__primary">
          <span className="stats-performance__eyebrow">Win rate</span>
          <strong className="display stats-performance__primary-value">{formatPercent(metrics.winScore)}</strong>
        </div>

        <div className="stats-performance__rail">
          <div className="stats-performance__rail-item">
            <span className="stats-performance__eyebrow">Player rating</span>
            <span className="stats-performance__rail-context">0-10 score</span>
            <strong className="display stats-performance__secondary-value">{metrics.playerRating.toFixed(1)}</strong>
          </div>

          <div className="stats-performance__rail-item stats-performance__rail-item--compact">
            <span className="stats-performance__eyebrow">Avg point diff</span>
            <strong className={cn("display stats-performance__rail-value", averagePointDiffAccent)}>
              {formatSignedValue(metrics.averagePointDiff)}
            </strong>
          </div>
        </div>
      </div>

      <div className="stats-performance__evidence">
        <span className="stats-performance__record-label">Record</span>

        <div
          aria-label={`Wins ${summary.wins}, losses ${summary.losses}`}
          className="stats-performance__split-bar"
          role="img"
        >
          <span
            className="stats-performance__split-fill stats-performance__split-fill--wins"
            style={{ width: getSplitWidth(summary.wins, summary.totalMatches) }}
          />
          <span
            className="stats-performance__split-fill stats-performance__split-fill--losses"
            style={{ width: getSplitWidth(summary.losses, summary.totalMatches) }}
          />
        </div>

        <div className="stats-performance__split-legend">
          <div className="stats-performance__split-item">
            <span className="stats-performance__split-label">Wins</span>
            <strong className="display stats-performance__split-value stats-performance__split-value--primary">{summary.wins}</strong>
          </div>

          <div className="stats-performance__split-item stats-performance__split-item--end">
            <span className="stats-performance__split-label">Losses</span>
            <strong className="display stats-performance__split-value stats-performance__split-value--danger">{summary.losses}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
