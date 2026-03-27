"use client";

import Link from "next/link";

import { MatchActionsMenu } from "@/app/_components/match-actions-menu";
import { formatCompactDate } from "@/lib/utils";
import type { MatchFeedItem } from "@/lib/view-models";

function joinNames(names: string[]) {
  return names.join("\n");
}

function formatSideLabel(names: string[]) {
  return names.join(" and ");
}

function getMatchLinkLabel(match: MatchFeedItem) {
  const formatLabel = match.format === "singles" ? "Singles match" : "Doubles match";

  return `${formatLabel}: ${formatSideLabel(match.ownSideNames)} versus ${formatSideLabel(match.opposingSideNames)}, score ${match.scoreFor}-${match.scoreAgainst}`;
}

export function MatchFeed({ matches }: Readonly<{ matches: MatchFeedItem[] }>) {
  if (!matches.length) {
    return <div className="empty-state">No matches to show yet.</div>;
  }

  return (
    <div className="match-feed">
      {matches.map((match) => {
        return (
          <article className="dashboard-match" key={match.id}>
            <div className={`dashboard-match__accent ${match.result === "Defeat" ? "is-loss" : ""}`} />
            <div className="dashboard-match__body">
              <div className="dashboard-match__meta">
                <span>{formatCompactDate(match.playedAt)}</span>
                <div className="dashboard-match__meta-actions">
                  <span className={match.result === "Defeat" ? "is-loss" : "is-win"}>
                    {match.result ?? match.format}
                  </span>
                  <MatchActionsMenu matchId={match.id} />
                </div>
              </div>

              <Link
                aria-label={getMatchLinkLabel(match)}
                className="dashboard-match__link"
                href={`/matches/${match.id}`}
              >
                <div className="dashboard-match__content">
                  <div className="dashboard-match__teams">
                    <p className="dashboard-match__side">{joinNames(match.ownSideNames)}</p>
                    <p className="dashboard-match__versus">versus</p>
                    <p className="dashboard-match__side dashboard-match__side--muted">
                      {joinNames(match.opposingSideNames)}
                    </p>
                  </div>

                  <p className="display dashboard-match__score">
                    {match.scoreFor}-{match.scoreAgainst}
                  </p>
                </div>
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
