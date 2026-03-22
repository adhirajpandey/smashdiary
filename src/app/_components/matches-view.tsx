"use client";

import { useMemo } from "react";

import { MatchFeed } from "@/app/_components/match-feed";
import { SectionHeading } from "@/app/_components/section-heading";
import { useSelectedPlayer } from "@/app/_components/selected-player-provider";
import { getPlayerMatches } from "@/lib/match-selectors";
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
    () => (selectedPlayerId ? getPlayerMatches(games, selectedPlayerId) : []),
    [games, selectedPlayerId],
  );

  return (
    <section className="dashboard-section">
      <SectionHeading
        eyebrow="Match history"
        title={selectedPlayer ? `${selectedPlayer.name}'s matches` : "Matches"}
        description="Standalone match history, sorted from newest to oldest."
        titleClassName="page-title"
      />

      <div className="section-offset">
        <MatchFeed games={selectedGames} playerId={selectedPlayerId} />
      </div>
    </section>
  );
}
