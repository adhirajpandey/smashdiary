"use client";

import { MatchActionsMenu } from "@/app/_components/match-actions-menu";
import { SectionHeading } from "@/app/_components/section-heading";
import type { ResolvedGame } from "@/lib/types";
import { formatGameDate, formatPlayerName, formatScore } from "@/lib/utils";

function getFormatTitle(format: "singles" | "doubles") {
  return format === "singles" ? "Singles match" : "Doubles match";
}

export function MatchDetailView({ match }: Readonly<{ match: ResolvedGame }>) {
  const sideA = match.sideAPlayers.map((player) => ({
    full: formatPlayerName(player.name),
    stacked: formatPlayerName(player.name, "stacked"),
  }));
  const sideB = match.sideBPlayers.map((player) => ({
    full: formatPlayerName(player.name),
    stacked: formatPlayerName(player.name, "stacked"),
  }));
  const sideAState = match.winnerSide === "A" ? "is-winner" : "is-loser";
  const sideBState = match.winnerSide === "B" ? "is-winner" : "is-loser";

  return (
    <section className="detail-view">
      <div className="detail-page__header">
        <div className="detail-page__header-row">
          <SectionHeading
            eyebrow="Match detail"
            title={getFormatTitle(match.format)}
            description={formatGameDate(match.playedOn, match.slot)}
            titleClassName="page-title detail-page__title"
          />
          <MatchActionsMenu className="detail-page__actions" deleteRedirectHref="/matches" matchId={match.id} />
        </div>
      </div>

      <section className="detail-stage">
        <div className="detail-stage__top">
          <div className="detail-stage__score-block">
            <span className="detail-stage__kicker">Final score</span>
            <div className="detail-stage__scoreline">
              <span className="display detail-stage__score-number">{formatScore(match.sideAScore)}</span>
              <span className="detail-stage__score-separator" aria-hidden="true">
                /
              </span>
              <span className="display detail-stage__score-number detail-stage__score-number--muted">
                {formatScore(match.sideBScore)}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-stage__versus" aria-hidden="true">
          versus
        </div>

        <div className="detail-stage__sides">
          <section className={`detail-stage__side ${sideAState}`}>
            <div className="detail-stage__side-top">
              <span className="detail-stage__side-label">Side A</span>
              {match.winnerSide === "A" ? <span className="detail-stage__side-badge">Winner</span> : null}
            </div>
            <div className="detail-stage__roster" role="list">
              {sideA.map((player) => (
                <p className="detail-stage__player" key={`side-a-${player.full}`} role="listitem">
                  {player.stacked.map((part, index) => (
                    <span className="detail-stage__player-line" key={`${player.full}-${part}-${index}`}>
                      {part}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </section>

          <section className={`detail-stage__side ${sideBState}`}>
            <div className="detail-stage__side-top">
              <span className="detail-stage__side-label">Side B</span>
              {match.winnerSide === "B" ? <span className="detail-stage__side-badge">Winner</span> : null}
            </div>
            <div className="detail-stage__roster" role="list">
              {sideB.map((player) => (
                <p className="detail-stage__player" key={`side-b-${player.full}`} role="listitem">
                  {player.stacked.map((part, index) => (
                    <span className="detail-stage__player-line" key={`${player.full}-${part}-${index}`}>
                      {part}
                    </span>
                  ))}
                </p>
              ))}
            </div>
          </section>
        </div>
      </section>
    </section>
  );
}
