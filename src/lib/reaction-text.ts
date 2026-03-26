import type { ResolvedGame } from "@/lib/types";

const WIN_REACTIONS = [
  "Clean finish. Keep that pressure going.",
  "Sharp win. You controlled the rally.",
  "Big result. Court looked easy for you today.",
];

const LOSS_REACTIONS = [
  "Close one. Reload and steal the next game.",
  "Not your day, but the comeback story starts now.",
  "Tough loss. You are one adjustment away.",
];

const NEUTRAL_REACTIONS = [
  "Match saved. Stats updated for the squad.",
  "Result locked. Next rally starts now.",
  "Score logged. Keep the streak moving.",
];

const FORBIDDEN_TOKENS = ["idiot", "stupid", "trash", "loser", "worthless", "hate"];

type ReactionTone = "win" | "loss" | "neutral";

export type MatchReaction = {
  text: string;
  tone: ReactionTone;
};

function pickDeterministic(items: string[], seed: string) {
  const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return items[hash % items.length] ?? items[0] ?? "";
}

function containsForbiddenToken(text: string) {
  const normalized = text.toLowerCase();
  return FORBIDDEN_TOKENS.some((token) => normalized.includes(token));
}

export function buildMatchReaction(game: ResolvedGame, selectedPlayerId: number | null): MatchReaction {
  if (!selectedPlayerId) {
    return { text: pickDeterministic(NEUTRAL_REACTIONS, String(game.id)), tone: "neutral" };
  }

  const sideA = game.sideAPlayers.some((player) => player.id === selectedPlayerId);
  const sideB = game.sideBPlayers.some((player) => player.id === selectedPlayerId);

  if (!sideA && !sideB) {
    return { text: pickDeterministic(NEUTRAL_REACTIONS, String(game.id)), tone: "neutral" };
  }

  const didWin = (sideA && game.winnerSide === "A") || (sideB && game.winnerSide === "B");
  const tone: ReactionTone = didWin ? "win" : "loss";
  const set = didWin ? WIN_REACTIONS : LOSS_REACTIONS;
  const text = pickDeterministic(set, `${game.id}:${selectedPlayerId}:${tone}`);

  if (containsForbiddenToken(text)) {
    return { text: pickDeterministic(NEUTRAL_REACTIONS, String(game.id)), tone: "neutral" };
  }

  return { text, tone };
}

