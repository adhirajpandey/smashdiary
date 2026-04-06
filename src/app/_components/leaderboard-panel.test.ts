import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { LeaderboardPanel } from "@/app/_components/leaderboard-panel";

describe("LeaderboardPanel", () => {
  it("renders backend-provided leaderboard text and entries without client-side score derivation", () => {
    const markup = renderToStaticMarkup(
      React.createElement(LeaderboardPanel, {
        leaderboard: {
          title: "Singles leaderboard",
          scoreLabel: "Leaderboard score",
          scoreHelpText: "Leaderboard score is a 0-10 view of the backend Elo ladder.",
          minimumMatches: 3,
          entries: [
            {
              id: "player-1",
              names: ["Aman"],
              wins: 7,
              totalMatches: 10,
              displayScore: 6.3,
              rawRankScore: 1630.24,
            },
          ],
        },
      }),
    );

    expect(markup).toContain("Singles leaderboard");
    expect(markup).toContain("Leaderboard score");
    expect(markup).toContain("backend Elo ladder");
    expect(markup).toContain("Aman");
    expect(markup).toContain("7 wins in 10 matches");
    expect(markup).toContain(">6.3<");
    expect(markup).toContain("aria-label=\"Leaderboard score information\"");
  });
});
