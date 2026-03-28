import type { ResolvedGame } from "@/lib/types";

export type GameFormSeedMode = "personalized" | "neutral";

export type GameFormSeed = {
  format: ResolvedGame["format"];
  playedOn: string;
  slot: ResolvedGame["slot"];
  sideAScore: number;
  sideBScore: number;
  sideAPlayers: string[];
  sideBPlayers: string[];
  mode: GameFormSeedMode;
};

function moveSelectedPlayerToFront(players: ResolvedGame["sideAPlayers"], selectedPlayerId: number) {
  const selectedPlayer = players.find((player) => player.id === selectedPlayerId);

  if (!selectedPlayer) {
    return players.map((player) => player.name);
  }

  return [selectedPlayer.name, ...players.filter((player) => player.id !== selectedPlayerId).map((player) => player.name)];
}

export function buildGameFormSeed(match: ResolvedGame, selectedPlayerId: number | null): GameFormSeed {
  const selectedPlayerIsOnSideA =
    selectedPlayerId !== null && match.sideAPlayers.some((player) => player.id === selectedPlayerId);
  const selectedPlayerIsOnSideB =
    selectedPlayerId !== null && match.sideBPlayers.some((player) => player.id === selectedPlayerId);

  if (selectedPlayerIsOnSideA && selectedPlayerId !== null) {
    return {
      format: match.format,
      playedOn: match.playedOn,
      slot: match.slot,
      sideAScore: match.sideAScore,
      sideBScore: match.sideBScore,
      sideAPlayers: moveSelectedPlayerToFront(match.sideAPlayers, selectedPlayerId),
      sideBPlayers: match.sideBPlayers.map((player) => player.name),
      mode: "personalized",
    };
  }

  if (selectedPlayerIsOnSideB && selectedPlayerId !== null) {
    return {
      format: match.format,
      playedOn: match.playedOn,
      slot: match.slot,
      sideAScore: match.sideBScore,
      sideBScore: match.sideAScore,
      sideAPlayers: moveSelectedPlayerToFront(match.sideBPlayers, selectedPlayerId),
      sideBPlayers: match.sideAPlayers.map((player) => player.name),
      mode: "personalized",
    };
  }

  return {
    format: match.format,
    playedOn: match.playedOn,
    slot: match.slot,
    sideAScore: match.sideAScore,
    sideBScore: match.sideBScore,
    sideAPlayers: match.sideAPlayers.map((player) => player.name),
    sideBPlayers: match.sideBPlayers.map((player) => player.name),
    mode: "neutral",
  };
}
