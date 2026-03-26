export const queryKeys = {
  players: () => ["players"] as const,
  games: (playerId?: string | null, limit?: number) => ["games", { playerId: playerId ?? null, limit: limit ?? null }] as const,
  game: (id: string) => ["game", id] as const,
  dashboard: (playerId?: string | null) => ["dashboard", playerId ?? null] as const,
  stats: (playerId?: string | null) => ["stats", playerId ?? null] as const,
  lastSavedGame: () => ["last-saved-game"] as const,
};
