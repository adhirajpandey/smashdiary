import { notFound } from "next/navigation";

import { AppShell } from "@/app/_components/app-shell";
import { SectionHeading } from "@/app/_components/section-heading";
import { SummaryStatTile } from "@/app/_components/summary-stat-tile";
import { getMatchDetailPageData } from "@/lib/queries/page-data";
import { formatGameDate, parseNumericId } from "@/lib/utils";

function joinNames(names: string[]) {
  return names.join(" / ");
}

function getFormatTitle(format: "singles" | "doubles") {
  return format === "singles" ? "Singles match" : "Doubles match";
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

  const winnerLabel = game.winnerSide === "A" ? "Side A" : "Side B";

  const sideA = joinNames(game.sideAPlayers.map((player) => player.name));
  const sideB = joinNames(game.sideBPlayers.map((player) => player.name));

  return (
    <AppShell activePath="">
      <section className="detail-view">
        <div className="detail-page__header">
          <SectionHeading
            eyebrow="Match detail"
            title={getFormatTitle(game.format)}
            description={formatGameDate(game.playedAt)}
            titleClassName="page-title detail-page__title"
          />
        </div>

        <section className="detail-page__summary">
          <div className="detail-page__score-tile">
            <span className="detail-page__summary-label">Final score</span>
            <strong className="display detail-page__score-value">
              {game.sideAScore}-{game.sideBScore}
            </strong>
          </div>
          <SummaryStatTile label="Winner" value={winnerLabel} accent="primary" />
        </section>

        <section className="detail-page__breakdown">
          <div className="dashboard-section__row">
            <h2 className="dashboard-section__title">Side breakdown</h2>
            <p className="stats-results__meta">{game.format}</p>
          </div>

          <div className="detail-page__side-list">
            <section className={`detail-page__side ${game.winnerSide === "A" ? "is-winner" : ""}`}>
              <div className="detail-page__side-meta">
                <span className="detail-page__side-label">Side A</span>
                <span className="detail-page__side-status">{game.winnerSide === "A" ? "Winner" : "Played"}</span>
              </div>
              <p className="detail-page__side-names">{sideA}</p>
              <p className="detail-page__side-score">Score {game.sideAScore}</p>
            </section>

            <section className={`detail-page__side ${game.winnerSide === "B" ? "is-winner" : ""}`}>
              <div className="detail-page__side-meta">
                <span className="detail-page__side-label">Side B</span>
                <span className="detail-page__side-status">{game.winnerSide === "B" ? "Winner" : "Played"}</span>
              </div>
              <p className="detail-page__side-names">{sideB}</p>
              <p className="detail-page__side-score">Score {game.sideBScore}</p>
            </section>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
