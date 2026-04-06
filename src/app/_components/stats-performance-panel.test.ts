import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { StatsPerformancePanel } from "@/app/_components/stats-performance-panel";

describe("StatsPerformancePanel", () => {
  it("renders the refined performance composition with a stacked right rail and integrated evidence band", () => {
    const markup = renderToStaticMarkup(
      React.createElement(StatsPerformancePanel, {
        metrics: {
          playerId: 1,
          playerName: "Adhiraj",
          format: "doubles",
          totalMatches: 12,
          winScore: 7.5,
          playerRating: 8.9,
          averagePointDiff: -1.3,
          wins: 9,
          losses: 3,
          recentMatches: [],
        },
        summary: {
          playerId: 1,
          playerName: "Adhiraj",
          format: "doubles",
          totalMatches: 12,
          wins: 9,
          losses: 3,
        },
      }),
    );

    expect(markup).toContain("Performance");
    expect(markup).toContain("Win rate");
    expect(markup).toContain("Player rating");
    expect(markup).toContain("0-10 score");
    expect(markup).toContain("Record");
    expect(markup).toContain("Avg point diff");
    expect(markup).toContain("-1.3");
    expect(markup).toContain("Wins");
    expect(markup).toContain("Losses");
    expect(markup).toContain(">9<");
    expect(markup).toContain(">3<");
    expect(markup).toContain("stats-performance__rail");
    expect(markup).toContain("stats-performance__evidence");
    expect(markup).not.toContain("Wins-Losses");
    expect(markup).not.toContain(">Matches<");
    expect(markup).not.toContain("stats-performance__record-value");
    expect(markup).not.toContain("stats-performance__support-item");
  });
});
