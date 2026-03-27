import clsx, { type ClassValue } from "clsx";

export const MATCH_TIME_ZONE = "Asia/Kolkata";

export type MatchDateFormatVariant = "compact" | "detail";

type MatchDateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const wallClockDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/;

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

function padDateSegment(value: number) {
  return String(value).padStart(2, "0");
}

function buildMatchDateParts(value: string): MatchDateParts {
  const trimmed = value.trim();
  const wallClockMatch = trimmed.match(wallClockDateTimePattern);

  if (wallClockMatch) {
    return {
      year: Number(wallClockMatch[1]),
      month: Number(wallClockMatch[2]),
      day: Number(wallClockMatch[3]),
      hour: Number(wallClockMatch[4]),
      minute: Number(wallClockMatch[5]),
      second: Number(wallClockMatch[6] ?? "0"),
    };
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid match date.");
  }

  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
    hour: parsed.getUTCHours(),
    minute: parsed.getUTCMinutes(),
    second: parsed.getUTCSeconds(),
  };
}

function createUtcWallClockDate(value: string) {
  const parts = buildMatchDateParts(value);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second));
}

function formatMatchDateTime(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: "UTC",
  }).format(createUtcWallClockDate(value));
}

export function formatMatchDate(value: string, variant: MatchDateFormatVariant): string;
export function formatMatchDate(value: string, timeZone: string, variant: MatchDateFormatVariant): string;
export function formatMatchDate(value: string, first: MatchDateFormatVariant | string, second?: MatchDateFormatVariant) {
  const variant = second ?? (first as MatchDateFormatVariant);

  if (variant === "compact") {
    return formatMatchDateTime(value, {
      day: "numeric",
      month: "short",
    });
  }

  return formatMatchDateTime(value, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatGameDate(value: string) {
  return formatMatchDate(value, "detail");
}

export function formatCompactDate(value: string) {
  return formatMatchDate(value, "compact");
}

export function formatScore(value: number) {
  return String(value).padStart(2, "0");
}

export function formatScoreline(scoreA: number, scoreB: number, separator: string) {
  return `${formatScore(scoreA)}${separator}${formatScore(scoreB)}`;
}

export function normalizePlayedAtValue(value: string) {
  const parts = buildMatchDateParts(value);
  return [
    `${parts.year}-${padDateSegment(parts.month)}-${padDateSegment(parts.day)}`,
    `${padDateSegment(parts.hour)}:${padDateSegment(parts.minute)}:${padDateSegment(parts.second)}`,
  ].join(" ");
}

export function toInputDateTimeValue(value: string) {
  const parts = buildMatchDateParts(value);
  return [
    `${parts.year}-${padDateSegment(parts.month)}-${padDateSegment(parts.day)}`,
    `${padDateSegment(parts.hour)}:${padDateSegment(parts.minute)}`,
  ].join("T");
}

export function fromInputDateTimeValue(value: string) {
  return normalizePlayedAtValue(value);
}

export function getCurrentInputDateTimeValue(now = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: MATCH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(now);
  const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")}T${getPart("hour")}:${getPart("minute")}`;
}

export function ensureArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value];
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
