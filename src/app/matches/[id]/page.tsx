import { notFound } from "next/navigation";

import { AppShell } from "@/app/_components/app-shell";
import { SectionHeading } from "@/app/_components/section-heading";
import { getMatchDetailPageData } from "@/lib/queries/page-data";
import { formatGameDate, parseNumericId } from "@/lib/utils";

function joinNames(names: string[]) {
  return names.join(" / ");
}

export default async function MatchDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  const gameId = parseNumericId(id);
  if (!gameId) {
    notFound();
  }
  const game = await getMatchDetailPageData(gameId);

  if (!game) {
    notFound();
  }

  const sideA = joinNames(game.sideAPlayers.map((player) => player.name));
  const sideB = joinNames(game.sideBPlayers.map((player) => player.name));

  return (
    <AppShell activePath="">
      <section className="detail-view">
        <div className="detail-header">
          <SectionHeading
            align="compact"
            eyebrow="Match detail"
            title={game.format}
            titleClassName="detail-header__title"
          />
          <p className="detail-header__date">{formatGameDate(game.playedAt)}</p>
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
    </AppShell>
  );
}
