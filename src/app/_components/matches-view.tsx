"use client";

import { MatchFeed } from "@/app/_components/match-feed";
import { SectionHeading } from "@/app/_components/section-heading";
import { StatsFormatSelector } from "@/app/_components/stats-format-selector";
import type { StatsFormat } from "@/lib/types";
import { formatStatsFormatLabel } from "@/lib/utils";
import type { MatchFeedItem } from "@/lib/view-models";

export function MatchesView({
  format,
  matches,
  selectedPlayerName,
}: Readonly<{
  format: StatsFormat;
  matches: MatchFeedItem[];
  selectedPlayerName: string | null;
}>) {
  const formatLabel = formatStatsFormatLabel(format);

  return (
    <section className="matches-page">
      <StatsFormatSelector />

      <div className="matches-page__header">
        <SectionHeading
          eyebrow="Match history"
          title={selectedPlayerName ? `${selectedPlayerName}'s ${format} matches` : `${formatLabel} matches`}
          description={
            selectedPlayerName
              ? `${matches.length} ${format} matches, newest first.`
              : `Choose a player to focus this ${format} feed.`
          }
          titleClassName="page-title matches-page__title"
        />
      </div>

      {!selectedPlayerName ? (
        <div className="matches-page__empty">
          <p className="matches-page__empty-title">Player context needed</p>
          <p className="muted-copy">Pick a player from the header to load a cleaner personal {format} timeline.</p>
        </div>
      ) : null}

      {selectedPlayerName ? (
        <>
          {matches.length ? (
            <MatchFeed matches={matches} />
          ) : (
            <div className="matches-page__empty">
              <p className="matches-page__empty-title">No matches yet</p>
              <p className="muted-copy">Start with a fresh {format} entry to build {selectedPlayerName}&apos;s match history.</p>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
