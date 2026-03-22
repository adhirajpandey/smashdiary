"use client";

import { useMemo } from "react";

import { MatchFeed } from "@/app/_components/match-feed";
import { PageHero } from "@/app/_components/page-hero";
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
    <section className="page-stack--compact">
      <PageHero
        eyebrow="Match history"
        title={selectedPlayer ? `${selectedPlayer.name}'s matches` : "Matches ready."}
        description={
          selectedPlayer
            ? "Standalone match history, sorted from newest to oldest."
            : "Pick a player to load a cleaner, player-specific history feed."
        }
        className="page-hero--matches"
        meta={
          selectedPlayer ? (
            <>
              <div className="page-hero-chip">
                <span className="page-hero-chip__label">Player</span>
                <strong className="page-hero-chip__value">{selectedPlayer.name}</strong>
              </div>
              <div className="page-hero-chip">
                <span className="page-hero-chip__label">Matches</span>
                <strong className="page-hero-chip__value">{selectedGames.length}</strong>
              </div>
              <div className="page-hero-chip">
                <span className="page-hero-chip__label">Sort</span>
                <strong className="page-hero-chip__value">Recent first</strong>
              </div>
            </>
          ) : (
            <div className="page-hero-chip page-hero-chip--prompt">
              <span className="page-hero-chip__label">Player context</span>
              <strong className="page-hero-chip__value">Select a player to focus the feed.</strong>
            </div>
          )
        }
        feature={
          selectedPlayer ? (
            <div className="matches-hero-feature">
              <p className="matches-hero-feature__eyebrow">Focused timeline</p>
              <p className="display matches-hero-feature__value">{selectedGames.length}</p>
              <p className="matches-hero-feature__copy">
                Every result for {selectedPlayer.name}, newest first and ready to scan.
              </p>
            </div>
          ) : (
            <div className="matches-hero-feature matches-hero-feature--empty">
              <p className="matches-hero-feature__eyebrow">History view</p>
              <p className="matches-hero-feature__copy">
                Once a player is selected, this screen narrows the full log into a clean personal match history.
              </p>
            </div>
          )
        }
        empty={!selectedPlayer}
      />

      <div>
        <MatchFeed games={selectedGames} playerId={selectedPlayerId} />
      </div>
    </section>
  );
}
