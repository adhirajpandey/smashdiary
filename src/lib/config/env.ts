export type RuntimeMode = "default" | "test";

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

type EnvSource = NodeJS.ProcessEnv;

type AppConfig = {
  ci: boolean;
  runtimeMode: RuntimeMode;
  isTestMode: boolean;
  databaseUrl?: string;
  logLevel: LogLevel;
  testMode: {
    sqliteDirName: string;
    sqliteFileName: string;
    seedFilePath: string;
  };
  playwright: {
    port: number;
    baseUrl: string;
    reuseExistingServer: boolean;
    nextDistDir: string;
    databaseUrl: string;
  };
};

const DEFAULT_LOG_LEVEL: LogLevel = "info";
const DEFAULT_PLAYWRIGHT_PORT = 3101;
const DEFAULT_PLAYWRIGHT_DIST_DIR = ".next-playwright";
const LOCAL_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5433/smashdiary";
const TEST_MODE_SQLITE_DIR_NAME = ".gstack";
const TEST_MODE_SQLITE_FILE_NAME = "test-mode.sqlite";
const TEST_MODE_SEED_FILE_PATH = "src/data/diary.json";

function readTrimmedEnv(env: EnvSource, key: keyof EnvSource) {
  const value = env[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function parseRuntimeMode(env: EnvSource): RuntimeMode {
  const value = readTrimmedEnv(env, "APP_MODE");

  if (!value) {
    return "default";
  }

  if (value === "test") {
    return "test";
  }

  throw new Error(`Invalid APP_MODE environment variable: "${value}". Expected "test" or unset.`);
}

function parseLogLevel(env: EnvSource): LogLevel {
  const value = readTrimmedEnv(env, "LOG_LEVEL");

  if (!value) {
    return DEFAULT_LOG_LEVEL;
  }

  const normalized = value.toLowerCase();

  if (LOG_LEVELS.includes(normalized as LogLevel)) {
    return normalized as LogLevel;
  }

  throw new Error(
    `Invalid LOG_LEVEL environment variable: "${value}". Expected one of ${LOG_LEVELS.join(", ")}.`,
  );
}

function parsePositiveInteger(value: string, key: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${key} environment variable: "${value}". Expected a positive integer.`);
  }

  return parsed;
}

function parsePlaywrightPort(env: EnvSource) {
  const value = readTrimmedEnv(env, "PLAYWRIGHT_UI_PORT");
  return value ? parsePositiveInteger(value, "PLAYWRIGHT_UI_PORT") : DEFAULT_PLAYWRIGHT_PORT;
}

function parseReuseExistingServer(env: EnvSource) {
  const value = readTrimmedEnv(env, "PLAYWRIGHT_REUSE_SERVER");

  if (!value) {
    return false;
  }

  if (value === "1") {
    return true;
  }

  if (value === "0") {
    return false;
  }

  throw new Error(`Invalid PLAYWRIGHT_REUSE_SERVER environment variable: "${value}". Expected "1", "0", or unset.`);
}

function parseNextDistDir(env: EnvSource) {
  return readTrimmedEnv(env, "NEXT_DIST_DIR") ?? DEFAULT_PLAYWRIGHT_DIST_DIR;
}

export function createAppConfig(env: EnvSource = process.env): AppConfig {
  const runtimeMode = parseRuntimeMode(env);
  const port = parsePlaywrightPort(env);

  return {
    ci: Boolean(readTrimmedEnv(env, "CI")),
    runtimeMode,
    isTestMode: runtimeMode === "test",
    databaseUrl: readTrimmedEnv(env, "DATABASE_URL"),
    logLevel: parseLogLevel(env),
    testMode: {
      sqliteDirName: TEST_MODE_SQLITE_DIR_NAME,
      sqliteFileName: TEST_MODE_SQLITE_FILE_NAME,
      seedFilePath: TEST_MODE_SEED_FILE_PATH,
    },
    playwright: {
      port,
      baseUrl: `http://127.0.0.1:${port}`,
      reuseExistingServer: parseReuseExistingServer(env),
      nextDistDir: parseNextDistDir(env),
      databaseUrl: LOCAL_DATABASE_URL,
    },
  };
}

export const appConfig = createAppConfig();

export function getRequiredDatabaseUrl(config: AppConfig = appConfig) {
  if (!config.databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  return config.databaseUrl;
}
