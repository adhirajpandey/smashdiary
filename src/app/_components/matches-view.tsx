"use client";

import { useMemo } from "react";

import { MatchFeed } from "@/app/_components/match-feed";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { getPlayerGames } from "@/lib/diary-metrics";
import type { Player, ResolvedGame } from "@/lib/types";

export function MatchesView({
  games,
  players,
}: Readonly<{
  games: ResolvedGame[];
  players: Player[];
}>) {
  const { selectedPlayerId } = useSelectedPlayer();
  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );
  const selectedGames = useMemo(
    () => (selectedPlayerId ? getPlayerGames(games, selectedPlayerId) : []),
    [games, selectedPlayerId],
  );

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
        <MatchFeed games={selectedGames} playerId={selectedPlayerId} />
      </div>
    </section>
  );
}
