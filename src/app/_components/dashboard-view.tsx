"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LeaderboardPanel } from "@/app/_components/leaderboard-panel";
import { MatchFeed } from "@/app/_components/match-feed";
import { SummaryStatTile } from "@/app/_components/summary-stat-tile";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { getDashboardMetrics, getTopPerformers } from "@/lib/match-selectors";
import { buildMatchReaction } from "@/lib/reaction-text";
import type { Player, ResolvedGame } from "@/lib/types";

function formatPercent(value: number) {
  return `${Math.round(value * 10)}%`;
}

export function DashboardView({
  games,
  players,
  savedMatchId,
}: Readonly<{
  games: ResolvedGame[];
  players: Player[];
  savedMatchId: number | null;
}>) {
  const { selectedPlayerId } = useSelectedPlayer();
  const [dismissedSavedGameId, setDismissedSavedGameId] = useState<number | null>(null);
  const metrics = useMemo(
    () => (selectedPlayerId ? getDashboardMetrics(games, players, selectedPlayerId) : null),
    [games, players, selectedPlayerId],
  );
  const topPerformers = useMemo(() => getTopPerformers(games, players), [games, players]);
  const savedGame = useMemo(() => games.find((game) => game.id === savedMatchId) ?? null, [games, savedMatchId]);
  const reaction = useMemo(() => {
    if (!savedGame || savedGame.id === dismissedSavedGameId) {
      return null;
    }
    return buildMatchReaction(savedGame, selectedPlayerId);
  }, [dismissedSavedGameId, savedGame, selectedPlayerId]);

  if (!metrics) {
    return null;
  }

  return (
    <>
      {reaction ? (
        <section className={`reaction-card reaction-card--${reaction.tone}`}>
          <div className="reaction-card__body">
            <p className="reaction-card__eyebrow">Post-match</p>
            <p className="reaction-card__text">{reaction.text}</p>
          </div>
          <div className="reaction-card__actions">
            <button
              className="reaction-card__dismiss"
              onClick={() => setDismissedSavedGameId(savedGame?.id ?? null)}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </section>
      ) : null}

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
        <MatchFeed games={metrics.recentMatches} playerId={metrics.playerId} />
      </section>

      <LeaderboardPanel players={topPerformers} />
    </>
  );
}
