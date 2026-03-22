import { z } from "zod";

import type { GameFormat, WinnerSide } from "@/lib/types";
import { normalizePlayerNameKey } from "@/lib/utils";

const playerNameSchema = z
  .string()
  .trim()
  .min(1, "Player name is required.")
  .max(32, "Player name must be 32 characters or fewer.");

export const gameFormSchema = z
  .object({
    playedAt: z.string().min(1, "Date and time are required."),
    format: z.enum(["singles", "doubles"] satisfies [GameFormat, GameFormat]),
    sideAScore: z.coerce.number().int().min(0).max(30),
    sideBScore: z.coerce.number().int().min(0).max(30),
    sideAPlayers: z.array(playerNameSchema),
    sideBPlayers: z.array(playerNameSchema),
  })
  .superRefine((value, ctx) => {
    const requiredCount = value.format === "singles" ? 1 : 2;
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

    if (value.sideAScore === value.sideBScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A final game needs one winning side.",
        path: ["sideAScore"],
      });
    }

    const topScore = Math.max(value.sideAScore, value.sideBScore);
    const bottomScore = Math.min(value.sideAScore, value.sideBScore);

    if (topScore < 21) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The winning side must reach at least 21.",
        path: ["sideAScore"],
      });
    }

    if (topScore === 21 && bottomScore > 19) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A 21-point finish must end before the opponent reaches 20.",
        path: ["sideAScore"],
      });
    }

    if (topScore >= 22 && topScore <= 29 && bottomScore !== topScore - 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Extended games must still end with a 2-point lead.",
        path: ["sideAScore"],
      });
    }

    if (topScore === 30 && bottomScore !== 29) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A 30-point finish is only valid at 30-29.",
        path: ["sideAScore"],
      });
    }
  });

export function deriveWinnerSide(sideAScore: number, sideBScore: number): WinnerSide {
  return sideAScore > sideBScore ? "A" : "B";
}
