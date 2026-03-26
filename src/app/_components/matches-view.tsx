"use client";

import { MatchFeed } from "@/app/_components/match-feed";
import { SectionHeading } from "@/app/_components/section-heading";
import type { MatchFeedItem } from "@/lib/view-models";

export function MatchesView({
  matches,
  selectedPlayerName,
}: Readonly<{
  matches: MatchFeedItem[];
  selectedPlayerName: string | null;
}>) {
  return (
    <section className="matches-page">
      <div className="matches-page__header">
        <SectionHeading
          eyebrow="Match history"
          title={selectedPlayerName ? `${selectedPlayerName}'s matches` : "Matches"}
          description={
            selectedPlayerName
              ? `${matches.length} matches, newest first.`
              : "Choose a player to focus this feed."
          }
          titleClassName="page-title matches-page__title"
        />
      </div>

      {!selectedPlayerName ? (
        <div className="matches-page__empty">
          <p className="matches-page__empty-title">Player context needed</p>
          <p className="muted-copy">Pick a player from the header to load a cleaner personal timeline.</p>
        </div>
      ) : null}

      {selectedPlayerName ? (
        <>
          {matches.length ? (
            <MatchFeed matches={matches} />
          ) : (
            <div className="matches-page__empty">
              <p className="matches-page__empty-title">No matches yet</p>
              <p className="muted-copy">Start with a fresh entry to build {selectedPlayerName}&apos;s match history.</p>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
