export const leaderboardConfig = {
  eloInitialRating: 1500,
  eloKFactor: 32,
  minimumMatches: 3,
  scoreLabel: "Leaderboard score",
  maxEntries: 5,
  normalizedScore: {
    floor: 0,
    ceiling: 10,
    midpointBase: 5,
    ratingStep: 100,
    decimals: 1,
  },
} as const;
