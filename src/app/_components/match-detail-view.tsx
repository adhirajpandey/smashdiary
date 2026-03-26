"use client";

import Link from "next/link";

import { StatusView } from "@/app/_components/status-view";
import { ApiClientError } from "@/lib/api/client";
import { useGameQuery } from "@/lib/api/hooks";
import { formatGameDate } from "@/lib/utils";

function joinNames(names: string[]) {
  return names.join(" / ");
}

export function MatchDetailView({ id }: Readonly<{ id: string }>) {
  const { data: game, isLoading, isError, error } = useGameQuery(id);

  if (isLoading) {
    return <StatusView eyebrow="Match" title="Loading match detail" description="Fetching the full scoreline." />;
  }

  if (isError) {
    if (error instanceof ApiClientError && error.status === 404) {
      return (
        <StatusView
          eyebrow="404"
          title="This court is empty"
          description="That page does not exist or the match record could not be found."
          action={
            <Link className="primary-button" href="/">
              Back to dashboard
            </Link>
          }
        />
      );
    }

    return <StatusView eyebrow="Match" title="Could not load this match" description={error.message} />;
  }

  if (!game) {
    return <StatusView eyebrow="Match" title="No match found" description="The requested record is unavailable." />;
  }

  const sideA = joinNames(game.sideAPlayers.map((player) => player.name));
  const sideB = joinNames(game.sideBPlayers.map((player) => player.name));

  return (
    <section className="detail-view">
      <div className="detail-header">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>
            Match detail
          </p>
          <h1 className="display detail-header__title">{game.format}</h1>
          <p className="detail-header__date">{formatGameDate(game.playedAt)}</p>
        </div>
        <span className="detail-pill">{game.winnerSide === "A" ? "Side A won" : "Side B won"}</span>
      </div>

      <section className="score-panel detail-score-panel">
        <p className="score-panel__label">Final Match Score</p>
        <div className="score-panel__grid">
          <div className="score-panel__side">
            <span className="score-panel__side-label">Side A</span>
            <p className="display score-panel__input detail-score-panel__value">{game.sideAScore}</p>
          </div>

          <div className="score-panel__divider" aria-hidden="true">
            /
          </div>

          <div className="score-panel__side">
            <span className="score-panel__side-label">Side B</span>
            <p className="display score-panel__input score-panel__input--alt detail-score-panel__value">
              {game.sideBScore}
            </p>
          </div>
        </div>
      </section>

      <div className="detail-team-list">
        <section className={`detail-team-card ${game.winnerSide === "A" ? "is-winner" : ""}`}>
          <div className="detail-team-card__meta">
            <span className="detail-team-card__label">Side A</span>
            <span className="detail-team-card__status">{game.winnerSide === "A" ? "Victory" : "Played"}</span>
          </div>
          <p className="detail-team-card__names">{sideA}</p>
        </section>

        <section className={`detail-team-card ${game.winnerSide === "B" ? "is-winner" : ""}`}>
          <div className="detail-team-card__meta">
            <span className="detail-team-card__label">Side B</span>
            <span className="detail-team-card__status">{game.winnerSide === "B" ? "Victory" : "Played"}</span>
          </div>
          <p className="detail-team-card__names">{sideB}</p>
        </section>
      </div>
    </section>
  );
}
