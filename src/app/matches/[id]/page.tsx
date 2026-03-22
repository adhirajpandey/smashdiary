import { notFound } from "next/navigation";

import { AppShell } from "@/app/_components/app-shell";
import { SectionHeading } from "@/app/_components/section-heading";
import { getMatchDetailPageData } from "@/lib/queries/page-data";
import { formatGameDate, formatPlayerName, parseNumericId } from "@/lib/utils";

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

  const sideA = game.sideAPlayers.map((player) => ({
    full: formatPlayerName(player.name),
    stacked: formatPlayerName(player.name, "stacked"),
  }));
  const sideB = game.sideBPlayers.map((player) => ({
    full: formatPlayerName(player.name),
    stacked: formatPlayerName(player.name, "stacked"),
  }));

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

        <section className="detail-stage">
          <div className="detail-stage__top">
            <div className="detail-stage__score-block">
              <span className="detail-stage__kicker">Final score</span>
              <div className="detail-stage__scoreline">
                <span className="display detail-stage__score-number">{game.sideAScore}</span>
                <span className="detail-stage__score-separator" aria-hidden="true">
                  /
                </span>
                <span className="display detail-stage__score-number detail-stage__score-number--muted">{game.sideBScore}</span>
              </div>
            </div>
          </div>

          <div className="detail-stage__versus" aria-hidden="true">
            versus
          </div>

          <div className="detail-stage__sides">
            <section className={`detail-stage__side ${game.winnerSide === "A" ? "is-winner" : ""}`}>
              <div className="detail-stage__side-top">
                <span className="detail-stage__side-label">Side A</span>
                {game.winnerSide === "A" ? <span className="detail-stage__side-badge">Winner</span> : null}
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
              <p className="display detail-stage__side-score">{game.sideAScore}</p>
            </section>

            <section className={`detail-stage__side ${game.winnerSide === "B" ? "is-winner" : ""}`}>
              <div className="detail-stage__side-top">
                <span className="detail-stage__side-label">Side B</span>
                {game.winnerSide === "B" ? <span className="detail-stage__side-badge">Winner</span> : null}
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
              <p className="display detail-stage__side-score">{game.sideBScore}</p>
            </section>
          </div>
        </section>
      </section>
    </AppShell>
  );
}
