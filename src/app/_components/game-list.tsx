import Link from "next/link";

import type { ResolvedGame } from "@/lib/types";
import { formatCompactDate, formatScore } from "@/lib/utils";

function joinNames(names: string[]) {
  return names.join(" / ");
}

export function GameList({ games }: Readonly<{ games: ResolvedGame[] }>) {
  if (!games.length) {
    return <div className="empty-state">No matches recorded yet. Start with a fresh 21-point log.</div>;
  }

  return (
    <div className="page-stack page-stack--compact">
      {games.map((game) => {
        const sideA = joinNames(game.sideAPlayers.map((player) => player.name));
        const sideB = joinNames(game.sideBPlayers.map((player) => player.name));
        const winnerLabel = game.winnerSide === "A" ? sideA : sideB;

        return (
          <Link className="match-card" href={`/matches/${game.id}`} key={game.id}>
            <div className="match-card__frame" aria-hidden="true" />

            <div className="match-card__topline">
              <div>
                <p className="eyebrow section-heading__eyebrow">
                  {game.format} game
                </p>
                <p className="match-card__date">{formatCompactDate(game.playedAt)}</p>
              </div>
              <span className="match-card__winner-tag">Winner: {winnerLabel}</span>
            </div>

            <div className="match-card__body">
              <div className="match-card__sides">
                <div className={`match-card__team ${game.winnerSide === "A" ? "is-winner" : ""}`}>
                  <div>
                    <p className="match-card__team-label">Side A</p>
                    <p className="match-card__team-names">{sideA}</p>
                  </div>
                  <span className="match-card__team-score">{formatScore(game.sideAScore)}</span>
                </div>

                <div className={`match-card__team ${game.winnerSide === "B" ? "is-winner" : ""}`}>
                  <div>
                    <p className="match-card__team-label">Side B</p>
                    <p className="match-card__team-names">{sideB}</p>
                  </div>
                  <span className="match-card__team-score">{formatScore(game.sideBScore)}</span>
                </div>
              </div>

              <div className="match-card__score-panel">
                <p className="match-card__score-kicker">Final</p>
                <p className="match-card__score">
                  <span>{formatScore(game.sideAScore)}</span>
                  <span className="match-card__score-divider">:</span>
                  <span>{formatScore(game.sideBScore)}</span>
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
