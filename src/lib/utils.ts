import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatGameDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function toInputDateTimeValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 16);
}

export function fromInputDateTimeValue(value: string) {
  return new Date(value).toISOString();
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
