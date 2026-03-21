const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

type LogLevel = (typeof LOG_LEVELS)[number];
type LogPayload = Record<string, unknown>;

const DEFAULT_LOG_LEVEL: LogLevel = "info";

function resolveLogLevel(): LogLevel {
  const value = process.env.LOG_LEVEL?.trim().toLowerCase();

  if (!value) {
    return DEFAULT_LOG_LEVEL;
  }

  return LOG_LEVELS.includes(value as LogLevel) ? (value as LogLevel) : DEFAULT_LOG_LEVEL;
}

function shouldLog(level: LogLevel) {
  return LOG_LEVELS.indexOf(level) >= LOG_LEVELS.indexOf(resolveLogLevel());
}

function writeLog(level: Exclude<LogLevel, "warn" | "error">, scope: string, event: string, payload?: LogPayload): void;
function writeLog(level: "warn" | "error", scope: string, event: string, payload?: LogPayload): void;
function writeLog(level: LogLevel, scope: string, event: string, payload?: LogPayload) {
  if (!shouldLog(level)) {
    return;
  }

  const message = `[${scope}] ${event}`;

  if (payload) {
    console[level](message, payload);
    return;
  }

  console[level](message);
}

export const logger = {
  debug(scope: string, event: string, payload?: LogPayload) {
    writeLog("debug", scope, event, payload);
  },
  info(scope: string, event: string, payload?: LogPayload) {
    writeLog("info", scope, event, payload);
  },
  warn(scope: string, event: string, payload?: LogPayload) {
    writeLog("warn", scope, event, payload);
  },
  error(scope: string, event: string, payload?: LogPayload) {
    writeLog("error", scope, event, payload);
  },
};

export type { LogLevel };
