"use client";

import { useId, useState, type FocusEvent } from "react";

import type { LeaderboardData, LeaderboardEntry } from "@/lib/types";

function formatLeaderboardMeta(entry: LeaderboardEntry) {
  return `${entry.wins} wins in ${entry.totalMatches} matches`;
}

export function LeaderboardPanel({
  leaderboard,
}: Readonly<{
  leaderboard: LeaderboardData;
}>) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const tooltipId = useId();

  function handleInfoBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocusTarget = event.relatedTarget as Node | null;
    if (!event.currentTarget.contains(nextFocusTarget)) {
      setIsInfoOpen(false);
    }
  }

  return (
    <section className="leaderboard">
      <div className="leaderboard__heading">
        <div
          className="leaderboard__info"
          data-open={isInfoOpen ? "true" : "false"}
          onBlur={handleInfoBlur}
          onMouseEnter={() => setIsInfoOpen(true)}
          onMouseLeave={() => setIsInfoOpen(false)}
        >
          <div className="leaderboard__title-row">
            <h2 className="dashboard-section__title leaderboard__title">{leaderboard.title}</h2>
            <button
              aria-controls={tooltipId}
              aria-describedby={tooltipId}
              aria-expanded={isInfoOpen}
              aria-label={`${leaderboard.scoreLabel} information`}
              className="leaderboard__info-button"
              type="button"
              onClick={() => setIsInfoOpen((currentState) => !currentState)}
              onFocus={() => setIsInfoOpen(true)}
            >
              i
            </button>
          </div>

          <div className="leaderboard__tooltip" data-open={isInfoOpen ? "true" : "false"} id={tooltipId} role="tooltip">
            <p className="leaderboard__tooltip-title">{leaderboard.scoreLabel}</p>
            <p className="leaderboard__tooltip-copy">{leaderboard.scoreHelpText}</p>
          </div>
        </div>
      </div>

      {!leaderboard.entries.length ? (
        <div className="leaderboard__empty">
          <p className="dashboard-empty__title">No leaderboard entries yet</p>
          <p className="muted-copy">{`At least ${leaderboard.minimumMatches} matches are required in this format.`}</p>
        </div>
      ) : (
        <div className="leaderboard__list">
          {leaderboard.entries.map((entry, index) => (
            <div className="leaderboard__row" key={entry.id}>
              <div className="leaderboard__left">
                <span className="display leaderboard__rank">{index + 1}</span>
                <div>
                  <p className="leaderboard__name">{entry.names.join(" & ")}</p>
                  <p className="leaderboard__wins">{formatLeaderboardMeta(entry)}</p>
                </div>
              </div>
              <strong aria-label={`${leaderboard.scoreLabel} ${entry.displayScore.toFixed(1)}`} className="leaderboard__score">
                {entry.displayScore.toFixed(1)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
