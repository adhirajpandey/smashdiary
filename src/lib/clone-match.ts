import type { GameFormat, ResolvedGame } from "@/lib/types";

export type CloneMatchSeed = {
  format: GameFormat;
  sideAPlayers: string[];
  sideBPlayers: string[];
};

export function buildCloneMatchSeed(match: ResolvedGame, selectedPlayerId: number | null): CloneMatchSeed {
  const selectedPlayerIsOnSideA = match.sideAPlayers.some((player) => player.id === selectedPlayerId);
  const selectedPlayerIsOnSideB = match.sideBPlayers.some((player) => player.id === selectedPlayerId);

  if (selectedPlayerIsOnSideB && !selectedPlayerIsOnSideA) {
    return {
      format: match.format,
      sideAPlayers: match.sideBPlayers.map((player) => player.name),
      sideBPlayers: match.sideAPlayers.map((player) => player.name),
    };
  }

  return {
    format: match.format,
    sideAPlayers: match.sideAPlayers.map((player) => player.name),
    sideBPlayers: match.sideBPlayers.map((player) => player.name),
  };
}
