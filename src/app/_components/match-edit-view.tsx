"use client";

import Link from "next/link";

import { GameForm } from "@/app/_components/game-form";
import { StatusView } from "@/app/_components/status-view";
import { ApiClientError } from "@/lib/api/client";
import { useGameQuery } from "@/lib/api/hooks";

export function MatchEditView({ id }: Readonly<{ id: string }>) {
  const { data: game, isLoading, isError, error } = useGameQuery(id);

  if (isLoading) {
    return <StatusView eyebrow="Match" title="Loading match editor" description="Fetching the saved line-up and scoreline." />;
  }

  if (isError) {
    if (error instanceof ApiClientError && error.status === 404) {
      return (
        <StatusView
          eyebrow="404"
          title="This court is empty"
          description="That page does not exist or the match record could not be found."
          action={
            <Link className="primary-button" href="/matches">
              Back to matches
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

  return (
    <section className="page-stack">
      <div className="detail-header">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>
            Edit match
          </p>
          <h1 className="display detail-header__title">{game.format}</h1>
          <p className="detail-header__date">Update players, score, or timestamp.</p>
        </div>
      </div>
      <GameForm game={game} />
    </section>
  );
}
