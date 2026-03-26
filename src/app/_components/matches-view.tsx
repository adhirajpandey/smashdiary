"use client";

import { useMemo } from "react";

import { MatchFeed } from "@/app/_components/match-feed";
import { StatusView } from "@/app/_components/status-view";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { useGamesQuery } from "@/lib/api/hooks";

export function MatchesView() {
  const { players, selectedPlayerId } = useSelectedPlayer();
  const { data: games = [], isLoading, isError, error } = useGamesQuery(selectedPlayerId);
  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );

  if (!selectedPlayerId) {
    return null;
  }

  if (isLoading) {
    return <StatusView eyebrow="Matches" title="Loading match history" description="Fetching your recent results." />;
  }

  if (isError) {
    return <StatusView eyebrow="Matches" title="Could not load matches" description={error.message} />;
  }

  return (
    <section className="dashboard-section">
      <p className="eyebrow" style={{ margin: 0 }}>
        Match history
      </p>
      <h1 className="display" style={{ margin: "0.25rem 0 0", fontSize: "2rem" }}>
        {selectedPlayer ? `${selectedPlayer.name}'s matches` : "Matches"}
      </h1>
      <p style={{ margin: "0.4rem 0 0", color: "var(--text-secondary)" }}>
        Standalone match history, sorted from newest to oldest.
      </p>

      <div style={{ marginTop: "1.2rem" }}>
        <MatchFeed games={games} playerId={selectedPlayerId} />
      </div>
    </section>
  );
}
