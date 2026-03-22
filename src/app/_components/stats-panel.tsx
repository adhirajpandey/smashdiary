"use client";

import { useMemo } from "react";

import { LeaderboardPanel } from "@/app/_components/leaderboard-panel";
import { SectionHeading } from "@/app/_components/section-heading";
import { SummaryStatTile } from "@/app/_components/summary-stat-tile";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { getDashboardMetrics, getPlayerStatsSummary, getTopPerformers } from "@/lib/match-selectors";
import type { Player, ResolvedGame } from "@/lib/types";

function formatPercent(value: number) {
  return `${Math.round(value * 10)}%`;
}

const resultsGrid = [
  { key: "singlesWins", label: "Singles Wins", accent: "default" },
  { key: "singlesLosses", label: "Singles Losses", accent: "default" },
  { key: "doublesWins", label: "Doubles Wins", accent: "default" },
  { key: "doublesLosses", label: "Doubles Losses", accent: "default" },
  { key: "wins", label: "Total Wins", accent: "primary" },
  { key: "losses", label: "Total Losses", accent: "danger" },
] as const;

export function StatsPanel({
  games,
  players,
}: Readonly<{
  games: ResolvedGame[];
  players: Player[];
}>) {
  const { selectedPlayerId } = useSelectedPlayer();
  const summary = useMemo(
    () => (selectedPlayerId ? getPlayerStatsSummary(games, players, selectedPlayerId) : null),
    [games, players, selectedPlayerId],
  );
  const metrics = useMemo(
    () => (selectedPlayerId ? getDashboardMetrics(games, players, selectedPlayerId) : null),
    [games, players, selectedPlayerId],
  );
  const leaderboard = useMemo(() => getTopPerformers(games, players), [games, players]);

  if (!summary || !metrics) {
    return (
      <section className="stats-page">
        <div className="stats-page__header">
          <SectionHeading
            eyebrow="Stats"
            title="Performance sheet"
            description="Choose a player to load ratings, records, and leaderboard context."
            titleClassName="page-title stats-page__title"
          />
        </div>

        <div className="stats-page__empty">
          <p className="stats-page__empty-title">Player context needed</p>
          <p className="muted-copy">Pick a player from the header to load personal ratings and results breakdown.</p>
        </div>

        <LeaderboardPanel players={leaderboard} />
      </section>
    );
  }

  return (
    <section className="stats-page">
      <div className="stats-page__header">
        <SectionHeading
          eyebrow="Performance sheet"
          title={`${summary.playerName}'s stats`}
          description={`${summary.totalMatches} matches across singles and doubles.`}
          titleClassName="page-title stats-page__title"
        />
      </div>

      <section className="dashboard-grid stats-page__metrics">
        <SummaryStatTile accent="primary" label="Win rate" value={formatPercent(metrics.winScore)} />
        <SummaryStatTile accent="secondary" label="Player rating" value={metrics.playerRating.toFixed(1)} />
      </section>

      <section className="stats-results">
        <div className="dashboard-section__row">
          <h2 className="dashboard-section__title">Results Breakdown</h2>
          <p className="stats-results__meta">{summary.totalMatches} matches</p>
        </div>

        <div className="stats-results__grid">
          {resultsGrid.map((item) => (
            <div className="stats-results__card" key={item.key}>
              <span className="stats-results__label">{item.label}</span>
              <strong
                className={`display stats-results__value ${
                  item.accent !== "default" ? `stats-results__value--${item.accent}` : ""
                }`}
              >
                {summary[item.key]}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <LeaderboardPanel players={leaderboard} title="Leaderboard" />
    </section>
  );
}
