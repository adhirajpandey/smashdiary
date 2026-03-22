"use client";

import Link from "next/link";

import { getMatchPerspective } from "@/lib/match-selectors";
import type { Player, ResolvedGame } from "@/lib/types";
import { formatCompactDate } from "@/lib/utils";

function joinNames(players: Player[]) {
  return players.map((player) => player.name).join("\n");
}

export function MatchFeed({
  games,
  playerId,
}: Readonly<{
  games: ResolvedGame[];
  playerId?: number | null;
}>) {
  if (!games.length) {
    return <div className="empty-state">No matches to show yet.</div>;
  }

  return (
    <div className="match-feed">
      {games.map((game) => {
        const perspective = getMatchPerspective(game, playerId);

        return (
          <Link className="dashboard-match" href={`/matches/${game.id}`} key={game.id}>
            <div className={`dashboard-match__accent ${perspective.result === "Defeat" ? "is-loss" : ""}`} />
            <div className="dashboard-match__body">
              <div className="dashboard-match__meta">
                <span>{formatCompactDate(game.playedAt)}</span>
                <span className={perspective.result === "Defeat" ? "is-loss" : "is-win"}>
                  {perspective.result ?? game.format}
                </span>
              </div>

              <div className="dashboard-match__content">
                <div className="dashboard-match__teams">
                  <p className="dashboard-match__side">{joinNames(perspective.ownSide)}</p>
                  <p className="dashboard-match__versus">versus</p>
                  <p className="dashboard-match__side dashboard-match__side--muted">{joinNames(perspective.opposingSide)}</p>
                </div>

                <p className="display dashboard-match__score">
                  {perspective.score.scoreFor}-{perspective.score.scoreAgainst}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
