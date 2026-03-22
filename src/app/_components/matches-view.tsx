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
    <section className="matches-page">
      <div className="matches-page__header">
        <SectionHeading
          eyebrow="Match history"
          title={selectedPlayer ? `${selectedPlayer.name}'s matches` : "Matches"}
          description={
            selectedPlayer
              ? `${selectedGames.length} matches, newest first.`
              : "Choose a player to focus this feed."
          }
          titleClassName="page-title matches-page__title"
        />
      </div>

      {!selectedPlayer ? (
        <div className="matches-page__empty">
          <p className="matches-page__empty-title">Player context needed</p>
          <p className="muted-copy">Pick a player from the header to load a cleaner personal timeline.</p>
        </div>
      ) : null}

      {selectedPlayer ? (
        <>
          {selectedGames.length ? (
            <MatchFeed games={selectedGames} playerId={selectedPlayerId} />
          ) : (
            <div className="matches-page__empty">
              <p className="matches-page__empty-title">No matches yet</p>
              <p className="muted-copy">Start with a fresh entry to build {selectedPlayer.name}&apos;s match history.</p>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
