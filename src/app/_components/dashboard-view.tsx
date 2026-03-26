"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { MatchFeed } from "@/app/_components/match-feed";
import { StatusView } from "@/app/_components/status-view";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { queryKeys } from "@/lib/api/query-keys";
import { useDashboardQuery } from "@/lib/api/hooks";
import { buildMatchReaction } from "@/lib/reaction-text";

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

export function DashboardView() {
  const { selectedPlayerId } = useSelectedPlayer();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useDashboardQuery(selectedPlayerId);
  const [dismissedSavedGameId, setDismissedSavedGameId] = useState<string | null>(null);
  const savedGameId = queryClient.getQueryData<string | null>(queryKeys.lastSavedGame()) ?? null;

  const savedGame = useMemo(
    () => data?.metrics?.recentMatches.find((game) => game.id === savedGameId) ?? null,
    [data?.metrics?.recentMatches, savedGameId],
  );
  const reaction = useMemo(() => {
    if (!savedGame || savedGame.id === dismissedSavedGameId) {
      return null;
    }
    return buildMatchReaction(savedGame, selectedPlayerId);
  }, [dismissedSavedGameId, savedGame, selectedPlayerId]);

  if (!selectedPlayerId) {
    return null;
  }

  if (isLoading) {
    return <StatusView eyebrow="Dashboard" title="Loading your dashboard" description="Pulling your recent court activity." />;
  }

  if (isError) {
    return <StatusView eyebrow="Dashboard" title="Could not load your dashboard" description={error.message} />;
  }

  if (!data?.metrics) {
    return <StatusView eyebrow="Dashboard" title="Pick a player to continue" description="Select your identity to personalize the diary." />;
  }

  return (
    <>
      {reaction ? (
        <section className={`reaction-card reaction-card--${reaction.tone}`}>
          <div>
            <p className="reaction-card__eyebrow">Post-match</p>
            <p className="reaction-card__text">{reaction.text}</p>
          </div>
          <button
            className="reaction-card__dismiss"
            onClick={() => {
              setDismissedSavedGameId(savedGame?.id ?? null);
              queryClient.removeQueries({ queryKey: queryKeys.lastSavedGame(), exact: true });
            }}
            type="button"
          >
            Dismiss
          </button>
        </section>
      ) : null}

      <Link className="quick-log" href="/matches/new">
        <span className="quick-log__icon">+</span>
        <span>Add a Match</span>
      </Link>

      <section className="dashboard-grid">
        <StatTile accent="lime" label="Win Score" value={data.metrics.winScore.toFixed(1)} />
        <StatTile accent="blue" label="Player Rating" value={data.metrics.playerRating.toFixed(1)} />
      </section>

      <section className="dashboard-section">
        <h2 className="dashboard-section__title">Your Activity</h2>
        <div className="activity-list">
          <div className="activity-list__row">
            <span>Singles Matches</span>
            <strong>{data.metrics.singlesGames}</strong>
          </div>
          <div className="activity-list__row">
            <span>Doubles Matches</span>
            <strong>{data.metrics.doublesGames}</strong>
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
        <MatchFeed games={data.metrics.recentMatches} playerId={data.metrics.playerId} />
      </section>

      <section className="leaderboard">
        <h2 className="dashboard-section__title" style={{ marginBottom: "1rem" }}>
          Top Performance
        </h2>
        <div className="leaderboard__list">
          {data.topPerformers.map((player, index) => (
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
