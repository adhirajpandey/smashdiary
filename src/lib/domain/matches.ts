import { z } from "zod";

import { MATCH_SLOTS, type GameFormat, type WinnerSide } from "@/lib/types";
import { getCurrentInputDateValue, normalizePlayedOnValue, normalizePlayerNameKey } from "@/lib/utils";

export function getPlayersPerSide(format: GameFormat) {
  return format === "singles" ? 1 : 2;
}

export function deriveWinnerSide(sideAScore: number, sideBScore: number): WinnerSide {
  return sideAScore > sideBScore ? "A" : "B";
}

const playedOnPattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function isCalendarDate(value: string) {
  const match = value.match(playedOnPattern);

  if (!match) {
    return false;
  }

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isFuturePlayedOnDate(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  try {
    return normalizePlayedOnValue(trimmed) > getCurrentInputDateValue();
  } catch {
    return false;
  }
}

export function isValidFinalScore(sideAScore: number, sideBScore: number) {
  if (sideAScore === sideBScore) {
    return false;
  }

  const topScore = Math.max(sideAScore, sideBScore);
  const bottomScore = Math.min(sideAScore, sideBScore);

  if (topScore < 21) {
    return false;
  }

  if (topScore === 21) {
    return bottomScore <= 19;
  }

  if (topScore <= 29) {
    return bottomScore === topScore - 2;
  }

  return topScore === 30 && bottomScore === 29;
}

const playerNameSchema = z
  .string()
  .trim()
  .min(1, "Player name is required.")
  .max(32, "Player name must be 32 characters or fewer.");

export const gameFormSchema = z
  .object({
    playedOn: z.string().min(1, "Date is required.").refine(isCalendarDate, "Enter a valid date."),
    slot: z.enum(MATCH_SLOTS, {
      message: "Slot is required.",
    }),
    format: z.enum(["singles", "doubles"] satisfies [GameFormat, GameFormat]),
    sideAScore: z.coerce.number().int().min(0).max(30),
    sideBScore: z.coerce.number().int().min(0).max(30),
    sideAPlayers: z.array(playerNameSchema),
    sideBPlayers: z.array(playerNameSchema),
  })
  .superRefine((value, ctx) => {
    const requiredCount = getPlayersPerSide(value.format);
    const normalizedSideAPlayers = value.sideAPlayers.map(normalizePlayerNameKey);
    const normalizedSideBPlayers = value.sideBPlayers.map(normalizePlayerNameKey);
    const uniqueSideAPlayers = new Set(normalizedSideAPlayers);
    const uniqueSideBPlayers = new Set(normalizedSideBPlayers);

    if (value.sideAPlayers.length !== requiredCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${value.format} needs ${requiredCount} player(s) on side A.`,
        path: ["sideAPlayers"],
      });
    }

    if (value.sideBPlayers.length !== requiredCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${value.format} needs ${requiredCount} player(s) on side B.`,
        path: ["sideBPlayers"],
      });
    }

    if (normalizedSideAPlayers.length !== uniqueSideAPlayers.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each player can only appear once on side A.",
        path: ["sideAPlayers"],
      });
    }

    if (normalizedSideBPlayers.length !== uniqueSideBPlayers.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each player can only appear once on side B.",
        path: ["sideBPlayers"],
      });
    }

    if (normalizedSideAPlayers.some((name) => uniqueSideBPlayers.has(name))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A player cannot appear on both sides.",
        path: ["sideAPlayers"],
      });
    }

    if (isFuturePlayedOnDate(value.playedOn)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Match date cannot be in the future.",
        path: ["playedOn"],
      });
    }

    if (!isValidFinalScore(value.sideAScore, value.sideBScore)) {
      let message = "A final game needs one winning side.";

      if (Math.max(value.sideAScore, value.sideBScore) < 21) {
        message = "The winning side must reach at least 21.";
      } else if (Math.max(value.sideAScore, value.sideBScore) === 21) {
        message = "A 21-point finish must end before the opponent reaches 20.";
      } else if (Math.max(value.sideAScore, value.sideBScore) < 30) {
        message = "Extended games must still end with a 2-point lead.";
      } else {
        message = "A 30-point finish is only valid at 30-29.";
      }

      if (value.sideAScore === value.sideBScore) {
        message = "A final game needs one winning side.";
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: ["sideAScore"],
      });
    }
  });
