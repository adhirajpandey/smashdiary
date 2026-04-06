export const appRoutes = {
  dashboard: "/",
  matches: "/matches",
  newMatch: "/matches/new",
  stats: "/stats",
} as const;

export function getMatchDetailRoute(matchId: number) {
  return `${appRoutes.matches}/${matchId}`;
}

export function getEditMatchRoute(matchId: number) {
  return `${getMatchDetailRoute(matchId)}/edit`;
}

export function getCloneMatchRoute(matchId: number) {
  return `${appRoutes.newMatch}?cloneFrom=${matchId}`;
}
