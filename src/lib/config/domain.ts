import type { StatsFormat } from "@/lib/types";

export const leaderboardConfig = {
  eloInitialRating: 1500,
  eloKFactor: 32,
  minimumMatches: {
    singles: 10,
    doubles: 5,
  } satisfies Record<StatsFormat, number>,
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
