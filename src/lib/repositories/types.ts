import type { MatchSlot, Player, ResolvedGame } from "@/lib/types";

export type SaveMatchInput = {
  id?: number;
  playedOn: string;
  slot: MatchSlot;
  format: ResolvedGame["format"];
  sideAPlayers: string[];
  sideBPlayers: string[];
  sideAScore: number;
  sideBScore: number;
  winnerSide: ResolvedGame["winnerSide"];
};

export type MatchRepository = {
  listPlayers: () => Promise<Player[]>;
  listMatches: () => Promise<ResolvedGame[]>;
  getMatchById: (id: number) => Promise<ResolvedGame | null>;
  saveMatch: (input: SaveMatchInput) => Promise<number>;
  deleteMatch: (id: number) => Promise<boolean>;
};
