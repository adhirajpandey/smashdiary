"use client";

import Link from "next/link";
import { useMemo } from "react";

import { MatchFeed } from "@/app/_components/match-feed";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { getDashboardMetrics, getTopPerformers } from "@/lib/diary-metrics";
import type { Player, ResolvedGame } from "@/lib/types";

function StatTile({
  label,
  value,
  accent,
}: Readonly<{
  label: string;
  value: string;
  accent: "lime" | "blue";
}>) {
  return (
    <div className="dashboard-tile">
      <p className="dashboard-tile__label">{label}</p>
      <p className={`display dashboard-tile__value dashboard-tile__value--${accent}`}>{value}</p>
    </div>
  );
}

export function DashboardView({
  games,
  players,
}: Readonly<{
  games: ResolvedGame[];
  players: Player[];
}>) {
  const { selectedPlayerId } = useSelectedPlayer();
  const metrics = useMemo(
    () => (selectedPlayerId ? getDashboardMetrics(games, players, selectedPlayerId) : null),
    [games, players, selectedPlayerId],
  );
  const topPerformers = useMemo(() => getTopPerformers(games, players), [games, players]);

  if (!metrics) {
    return (
      <section className="section-block">
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>Choose a player to load the dashboard.</p>
      </section>
    );
  }

  return (
    <>
      <Link className="quick-log" href="/matches/new">
        <span className="quick-log__icon">+</span>
        <span>Add a Match</span>
      </Link>

      <section className="dashboard-grid">
        <StatTile accent="lime" label="Win Score" value={metrics.winScore.toFixed(1)} />
        <StatTile accent="blue" label="Player Rating" value={metrics.playerRating.toFixed(1)} />
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
        <MatchFeed games={metrics.recentMatches} playerId={metrics.playerId} />
      </section>

      <section className="leaderboard">
        <h2 className="dashboard-section__title" style={{ marginBottom: "1rem" }}>
          Top Performance
        </h2>
        <div className="leaderboard__list">
          {topPerformers.map((player, index) => (
            <div className="leaderboard__row" key={player.playerId}>
              <div className="leaderboard__left">
                <span className="display leaderboard__rank">{index + 1}</span>
                <div>
                  <p className="leaderboard__name">{player.playerName}</p>
                  <p className="leaderboard__wins">{player.wins} wins</p>
                </div>
              </div>
              <strong className="leaderboard__rating">{player.rating.toFixed(1)}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
