import clsx, { type ClassValue } from "clsx";

import { MATCH_SLOTS, type MatchSlot, type StatsFormat } from "@/lib/types";

export const MATCH_TIME_ZONE = "Asia/Kolkata";
export const DEFAULT_MATCH_SLOT: MatchSlot = "8 PM";

export type MatchDateFormatVariant = "compact" | "detail";

type MatchDateParts = {
  year: number;
  month: number;
  day: number;
};

const wallClockDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
// A trailing Z is UTC, so the literal date part matches the UTC date without any timezone math.
const wallClockDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?Z?$/;
const slotOrder = new Map(MATCH_SLOTS.map((slot, index) => [slot, index]));

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

function padDateSegment(value: number) {
  return String(value).padStart(2, "0");
}

function buildMatchDateParts(value: string): MatchDateParts {
  const trimmed = value.trim();
  const wallClockDateMatch = trimmed.match(wallClockDatePattern);
  const wallClockMatch = trimmed.match(wallClockDateTimePattern);

  if (wallClockDateMatch) {
    return {
      year: Number(wallClockDateMatch[1]),
      month: Number(wallClockDateMatch[2]),
      day: Number(wallClockDateMatch[3]),
    };
  }

  if (wallClockMatch) {
    return {
      year: Number(wallClockMatch[1]),
      month: Number(wallClockMatch[2]),
      day: Number(wallClockMatch[3]),
    };
  }

  throw new Error("Invalid match date.");
}

function createUtcDate(value: string) {
  const parts = buildMatchDateParts(value);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function formatMatchDateValue(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: "UTC",
  }).format(createUtcDate(value));
}

export function formatMatchDate(value: string, variant: MatchDateFormatVariant) {
  if (variant === "compact") {
    return formatMatchDateValue(value, {
      day: "numeric",
      month: "short",
    });
  }

  return formatMatchDateValue(value, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function getMatchSlotOrder(slot: MatchSlot) {
  return slotOrder.get(slot) ?? -1;
}

export function formatMatchDateWithSlot(value: string, slot: MatchSlot, variant: MatchDateFormatVariant) {
  return `${formatMatchDate(value, variant)} • ${slot}`;
}

export function formatGameDate(value: string, slot: MatchSlot) {
  return formatMatchDateWithSlot(value, slot, "detail");
}

export function formatCompactDate(value: string, slot?: MatchSlot) {
  const formattedDate = formatMatchDate(value, "compact");
  return slot ? `${formattedDate} • ${slot}` : formattedDate;
}

export function formatScore(value: number) {
  return String(value).padStart(2, "0");
}

export function formatScoreline(scoreA: number, scoreB: number, separator: string) {
  return `${formatScore(scoreA)}${separator}${formatScore(scoreB)}`;
}

export function normalizePlayedOnValue(value: string) {
  const parts = buildMatchDateParts(value);
  return `${parts.year}-${padDateSegment(parts.month)}-${padDateSegment(parts.day)}`;
}

export function toInputDateValue(value: string) {
  return normalizePlayedOnValue(value);
}

export function getCurrentInputDateValue(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MATCH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}`;
}

export function normalizePlayerName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizePlayerNameKey(name: string) {
  return normalizePlayerName(name).toLowerCase();
}

export function parseNumericId(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function isStatsFormat(value: string): value is StatsFormat {
  return value === "singles" || value === "doubles";
}

export function parseStatsFormat(value: string | null | undefined): StatsFormat {
  return isStatsFormat(String(value ?? "")) ? (value as StatsFormat) : "singles";
}

export function formatStatsFormatLabel(format: StatsFormat) {
  return format === "singles" ? "Singles" : "Doubles";
}

export function formatPlayerName(name: string): string;
export function formatPlayerName(name: string, variant: "full"): string;
export function formatPlayerName(name: string, variant: "stacked"): string[];
export function formatPlayerName(name: string, variant: "full" | "stacked" = "full") {
  const normalized = normalizePlayerName(name);

  if (variant === "full") {
    return normalized;
  }

  return normalized.split(" ").filter(Boolean);
}
