"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MatchActionsMenu } from "@/app/_components/match-actions-menu";
import { SectionHeading } from "@/app/_components/section-heading";
import { useToast } from "@/app/_components/toast-provider";
import { ApiClientError, useDeleteMatchMutation } from "@/lib/api/client";
import type { ResolvedGame } from "@/lib/types";
import { formatGameDate, formatPlayerName } from "@/lib/utils";

function getFormatTitle(format: "singles" | "doubles") {
  return format === "singles" ? "Singles match" : "Doubles match";
}

export function MatchDetailView({ match }: Readonly<{ match: ResolvedGame }>) {
  const router = useRouter();
  const { pushToast } = useToast();
  const deleteMatchMutation = useDeleteMatchMutation(match.id);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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

  async function handleDelete() {
    setDeleteError(null);

    try {
      await deleteMatchMutation.mutateAsync();
      pushToast({
        variant: "success",
        title: "Match deleted",
        description: "The saved scoreline has been cleared from your diary.",
      });
      router.push("/matches");
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Could not delete match. Please try again.";

      setDeleteError(message);
      pushToast({
        variant: "error",
        title: "Delete failed",
        description: message,
        durationMs: null,
      });
    }
  }

  return (
    <section className="detail-view">
      <div className="detail-page__header">
        <SectionHeading
          eyebrow="Match detail"
          title={getFormatTitle(match.format)}
          description={formatGameDate(match.playedAt)}
          titleClassName="page-title detail-page__title"
        />
      </div>

      <section className="detail-stage">
        <div className="detail-stage__top">
          <div className="detail-stage__score-block">
            <span className="detail-stage__kicker">Final score</span>
            <div className="detail-stage__scoreline">
              <span className="display detail-stage__score-number">{match.sideAScore}</span>
              <span className="detail-stage__score-separator" aria-hidden="true">
                /
              </span>
              <span className="display detail-stage__score-number detail-stage__score-number--muted">
                {match.sideBScore}
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
            <p className="display detail-stage__side-score">{match.sideAScore}</p>
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
            <p className="display detail-stage__side-score">{match.sideBScore}</p>
          </section>
        </div>
      </section>

      <section className="detail-actions">
        <div className="detail-actions__row">
          <MatchActionsMenu className="detail-actions__menu" matchId={match.id} />
          <button
            className="danger-button detail-actions__button"
            onClick={() => {
              setDeleteError(null);
              setIsDeleteConfirmOpen((current) => !current);
            }}
            type="button"
          >
            {isDeleteConfirmOpen ? "Close delete" : "Delete match"}
          </button>
        </div>

        {isDeleteConfirmOpen ? (
          <div className="detail-delete">
            <div className="detail-delete__copy">
              <p className="detail-delete__eyebrow">Destructive action</p>
              <p className="detail-delete__title">Remove this saved match?</p>
              <p className="detail-delete__description">
                This deletes the saved scoreline and roster mapping. Player records stay intact.
              </p>
            </div>

            <div className="detail-delete__actions">
              <button
                className="secondary-button detail-actions__button"
                disabled={deleteMatchMutation.isPending}
                onClick={() => {
                  setDeleteError(null);
                  setIsDeleteConfirmOpen(false);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="danger-button detail-actions__button"
                disabled={deleteMatchMutation.isPending}
                onClick={() => {
                  void handleDelete();
                }}
                type="button"
              >
                {deleteMatchMutation.isPending ? "Deleting..." : "Confirm delete"}
              </button>
            </div>

            {deleteError ? <p className="detail-delete__error">{deleteError}</p> : null}
          </div>
        ) : null}
      </section>
    </section>
  );
}
