"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { MatchFeed } from "@/app/_components/match-feed";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { getDashboardMetrics, getTopPerformers } from "@/lib/match-selectors";
import { buildMatchReaction } from "@/lib/reaction-text";
import type { Player, ResolvedGame } from "@/lib/types";

function StatTile({
  id,
  label,
  value,
  accent,
  description,
  bubbleAlign,
  isOpen,
  onToggle,
}: Readonly<{
  id: string;
  label: string;
  value: string;
  accent: "lime" | "blue";
  description: string;
  bubbleAlign: "start" | "end";
  isOpen: boolean;
  onToggle: (id: string) => void;
}>) {
  const descriptionId = `${id}-description`;

  return (
    <div className="dashboard-tile">
      <div className="dashboard-tile__header">
        <p className="dashboard-tile__label">{label}</p>
        <div className="dashboard-tile__info-wrap">
          <button
            aria-controls={descriptionId}
            aria-expanded={isOpen}
            aria-label={`Explain ${label}`}
            className={`dashboard-tile__info ${isOpen ? "is-active" : ""}`}
            onClick={() => onToggle(id)}
            type="button"
          >
            i
          </button>
          {isOpen ? (
            <p className={`dashboard-tile__bubble dashboard-tile__bubble--${bubbleAlign}`} id={descriptionId} role="tooltip">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <p className={`display dashboard-tile__value dashboard-tile__value--${accent}`}>{value}</p>
    </div>
  );
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
  const [openMetricId, setOpenMetricId] = useState<string | null>(null);
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

  const handleToggleMetric = (metricId: string) => {
    setOpenMetricId((current) => (current === metricId ? null : metricId));
  };

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
        <StatTile
          accent="lime"
          bubbleAlign="start"
          description="Shows your win rate on a 10-point scale."
          id="win-rating"
          isOpen={openMetricId === "win-rating"}
          label="Win Rate"
          onToggle={handleToggleMetric}
          value={metrics.winScore.toFixed(1)}
        />
        <StatTile
          accent="blue"
          bubbleAlign="end"
          description="Based on your win rate, with a boost for positive average point difference, capped at 10."
          id="player-rating"
          isOpen={openMetricId === "player-rating"}
          label="Player Rating"
          onToggle={handleToggleMetric}
          value={metrics.playerRating.toFixed(1)}
        />
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
        <h2 className="dashboard-section__title leaderboard__title">
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
