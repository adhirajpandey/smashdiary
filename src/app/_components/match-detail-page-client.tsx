"use client";

import { MatchDetailView } from "@/app/_components/match-detail-view";
import { StatusView } from "@/app/_components/status-view";
import { ApiClientError, useMatchDetailQuery } from "@/lib/api/client";

export function MatchDetailPageClient({ matchId }: Readonly<{ matchId: number }>) {
  const { data, error, isPending } = useMatchDetailQuery(matchId);

  if (isPending) {
    return (
      <StatusView
        eyebrow="Loading"
        title="Loading match"
        description="Pulling the full scoreline and player roster."
      />
    );
  }

  if (error instanceof ApiClientError && error.code === "NOT_FOUND") {
    return (
      <StatusView
        eyebrow="404"
        title="This court is empty"
        description="That page does not exist or the match record could not be found."
      />
    );
  }

  if (error) {
    return <StatusView eyebrow="System fault" title="Could not load match" description={error.message} />;
  }

  return <MatchDetailView match={data.match} />;
}
