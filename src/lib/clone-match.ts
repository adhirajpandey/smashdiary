import { buildGameFormSeed, type GameFormSeedMode } from "@/lib/game-form-seed";
import type { GameFormat, ResolvedGame } from "@/lib/types";

export type CloneMatchSeed = {
  format: GameFormat;
  playedOn: string;
  sideAPlayers: string[];
  sideBPlayers: string[];
  mode: GameFormSeedMode;
};

export function buildCloneMatchSeed(match: ResolvedGame, selectedPlayerId: number | null): CloneMatchSeed {
  const seed = buildGameFormSeed(match, selectedPlayerId);

  return {
    format: seed.format,
    playedOn: seed.playedOn,
    sideAPlayers: seed.sideAPlayers,
    sideBPlayers: seed.sideBPlayers,
    mode: seed.mode,
  };
}
