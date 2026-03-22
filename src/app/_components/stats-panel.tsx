"use client";

import { useMemo } from "react";

import { PageHero } from "@/app/_components/page-hero";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { getDashboardMetrics, getPlayerStatsSummary } from "@/lib/match-selectors";
import type { Player, ResolvedGame } from "@/lib/types";

function formatPercent(value: number) {
  return `${Math.round(value * 10)}%`;
}

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

  if (!summary || !metrics) {
    return (
      <section className="stats-page">
        <PageHero
          eyebrow="Stats"
          title="Performance sheet ready."
          description="Choose a player to load their match rhythm, ratings, and recent form."
          empty
        />
      </section>
    );
  }

  return (
    <section className="stats-page">
      <PageHero
        eyebrow="Performance sheet"
        title={`${summary.playerName}'s stats`}
        description="Player performance, match volume, and recent form in one place."
        titleClassName="page-title--large"
        className="page-hero--stats"
        meta={
          <>
            <div className="page-hero-chip">
              <span className="page-hero-chip__label">Record</span>
              <strong className="page-hero-chip__value">
                {summary.wins}-{summary.losses}
              </strong>
            </div>
            <div className="page-hero-chip">
              <span className="page-hero-chip__label">Matches</span>
              <strong className="page-hero-chip__value">{summary.totalMatches}</strong>
            </div>
            <div className="page-hero-chip">
              <span className="page-hero-chip__label">Trend</span>
              <strong className="page-hero-chip__value">{summary.wins >= summary.losses ? "Up" : "Even"}</strong>
            </div>
          </>
        }
        feature={
          <div className="stats-hero__band">
            <div className="stats-spotlight">
              <p className="eyebrow stats-spotlight__eyebrow">Win rate</p>
              <p className="display stats-spotlight__value">{formatPercent(metrics.winScore)}</p>
              <p className="stats-spotlight__caption">{summary.wins} wins from {summary.totalMatches} matches</p>
            </div>

            <div className="stats-rating">
              <p className="eyebrow stats-rating__eyebrow">Player rating</p>
              <p className="display stats-rating__value">{metrics.playerRating.toFixed(1)}</p>
              <div className="stats-rating__stack">
                <div className="stats-rating__meta">
                  <span className="stats-rating__meta-label">Record</span>
                  <strong className="stats-rating__meta-value">
                    {summary.wins}-{summary.losses}
                  </strong>
                </div>
                <div className="stats-rating__meta">
                  <span className="stats-rating__meta-label">Trend</span>
                  <strong className="stats-rating__meta-value">
                    {summary.wins >= summary.losses ? "Up" : "Even"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        }
      />

      <section className="stats-support">
        <div className="stats-breakdown">
          <div className="stats-breakdown__header">
            <p className="section-title section-title--tight">Match breakdown</p>
            <p className="stats-breakdown__meta">{summary.totalMatches} matches</p>
          </div>

          <div className="stats-breakdown__grid">
            <div className="stats-breakdown__item">
              <span className="stats-breakdown__label">Wins</span>
              <strong className="display stats-breakdown__value stats-breakdown__value--primary">{summary.wins}</strong>
            </div>
            <div className="stats-breakdown__item">
              <span className="stats-breakdown__label">Losses</span>
              <strong className="display stats-breakdown__value stats-breakdown__value--secondary">{summary.losses}</strong>
            </div>
            <div className="stats-breakdown__item">
              <span className="stats-breakdown__label">Singles</span>
              <strong className="display stats-breakdown__value">{summary.singlesGames}</strong>
            </div>
            <div className="stats-breakdown__item">
              <span className="stats-breakdown__label">Doubles</span>
              <strong className="display stats-breakdown__value">{summary.doublesGames}</strong>
            </div>
          </div>
        </div>

        <div className="stats-form">
          <div className="stats-form__header">
            <p className="section-title section-title--tight">Recent form</p>
            <p className="stats-form__meta">Last {summary.recentForm.length || 0} results</p>
          </div>

          {summary.recentForm.length ? (
            <div className="stats-form__track" aria-label="Recent form">
              {summary.recentForm.map((result, index) => (
                <div className={`stats-form__marker ${result === "W" ? "is-win" : "is-loss"}`} key={`${result}-${index}`}>
                  <span className="stats-form__index">{index + 1}</span>
                  <span className="display stats-form__result">{result}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted-copy">No recent matches yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
