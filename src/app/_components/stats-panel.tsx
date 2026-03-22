"use client";

import { useMemo } from "react";

import { SectionHeading } from "@/app/_components/section-heading";
import { SummaryStatTile } from "@/app/_components/summary-stat-tile";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { getPlayerStatsSummary } from "@/lib/match-selectors";
import type { Player, ResolvedGame } from "@/lib/types";

export function StatsPanel({
  games,
  players,
}: Readonly<{
  games: ResolvedGame[];
  players: Player[];
}>) {
  const { selectedPlayerId } = useSelectedPlayer();
  const stats = useMemo(
    () => (selectedPlayerId ? getPlayerStatsSummary(games, players, selectedPlayerId) : null),
    [games, players, selectedPlayerId],
  );

  if (!stats) {
    return (
      <section className="section-block page-stack">
        <SectionHeading align="compact" eyebrow="Stats" description="Choose a player to load match stats." />
      </section>
    );
  }

  return (
    <section className="page-stack">
      <div className="section-block glass page-stack">
        <SectionHeading
          eyebrow="Form line"
          title={`${stats.playerName}'s court pulse.`}
          titleClassName="page-title page-title--large"
        />

        <div className="stats-grid">
          <SummaryStatTile label="Total matches" value={stats.totalMatches} />
          <SummaryStatTile accent="primary" label="Wins" value={stats.wins} />
          <SummaryStatTile accent="secondary" label="Losses" value={stats.losses} />
          <SummaryStatTile label="Singles" value={stats.singlesGames} />
          <SummaryStatTile label="Doubles" value={stats.doublesGames} />
        </div>
      </div>

      <section className="section-block page-stack">
        <p className="section-title section-title--tight">Recent form</p>
        <div className="form-pill-list">
          {stats.recentForm.length ? (
            stats.recentForm.map((result, index) => (
              <div className={`form-pill ${result === "W" ? "is-win" : "is-loss"}`} key={`${result}-${index}`}>
                {result}
              </div>
            ))
          ) : (
            <p className="muted-copy">No recent matches yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
