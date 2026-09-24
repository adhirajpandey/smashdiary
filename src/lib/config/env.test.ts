import { createAppConfig, getRequiredDatabaseUrl } from "@/lib/config/env";

describe("config env", () => {
  it("uses the expected defaults when optional values are omitted", () => {
    const config = createAppConfig({});

    expect(config.ci).toBe(false);
    expect(config.runtimeMode).toBe("default");
    expect(config.isTestMode).toBe(false);
    expect(config.databaseUrl).toBeUndefined();
    expect(config.logLevel).toBe("info");
    expect(config.playwright.port).toBe(3101);
    expect(config.playwright.baseUrl).toBe("http://127.0.0.1:3101");
    expect(config.playwright.reuseExistingServer).toBe(false);
    expect(config.playwright.nextDistDir).toBe(".next-playwright");
    expect(config.playwright.databaseUrl).toBe("postgres://postgres:postgres@127.0.0.1:5433/smashdiary");
    expect(config.testMode.sqliteDirName).toBe(".gstack");
    expect(config.testMode.sqliteFileName).toBe("test-mode.sqlite");
    expect(config.testMode.seedFilePath).toBe("src/data/diary.json");
  });

  it("parses valid runtime config values", () => {
    const config = createAppConfig({
      APP_MODE: "test",
      DATABASE_URL: "postgres://smash-diary",
      LOG_LEVEL: "warn",
      PLAYWRIGHT_UI_PORT: "4100",
      PLAYWRIGHT_REUSE_SERVER: "1",
      NEXT_DIST_DIR: ".next-e2e",
      CI: "1",
    });

    expect(config.ci).toBe(true);
    expect(config.runtimeMode).toBe("test");
    expect(config.isTestMode).toBe(true);
    expect(config.databaseUrl).toBe("postgres://smash-diary");
    expect(config.logLevel).toBe("warn");
    expect(config.playwright.port).toBe(4100);
    expect(config.playwright.baseUrl).toBe("http://127.0.0.1:4100");
    expect(config.playwright.reuseExistingServer).toBe(true);
    expect(config.playwright.nextDistDir).toBe(".next-e2e");
  });

  it("fails fast on invalid env values", () => {
    expect(() => createAppConfig({ APP_MODE: "prod" })).toThrow(
      'Invalid APP_MODE environment variable: "prod". Expected "test" or unset.',
    );
    expect(() => createAppConfig({ LOG_LEVEL: "trace" })).toThrow(
      'Invalid LOG_LEVEL environment variable: "trace". Expected one of debug, info, warn, error.',
    );
    expect(() => createAppConfig({ PLAYWRIGHT_UI_PORT: "0" })).toThrow(
      'Invalid PLAYWRIGHT_UI_PORT environment variable: "0". Expected a positive integer.',
    );
    expect(() => createAppConfig({ PLAYWRIGHT_REUSE_SERVER: "yes" })).toThrow(
      'Invalid PLAYWRIGHT_REUSE_SERVER environment variable: "yes". Expected "1", "0", or unset.',
    );
  });

  it("requires database url only when explicitly requested", () => {
    expect(() => getRequiredDatabaseUrl(createAppConfig({}))).toThrow(
      "Missing DATABASE_URL environment variable.",
    );
    expect(
      getRequiredDatabaseUrl(createAppConfig({ DATABASE_URL: "postgres://smash-diary" })),
    ).toBe("postgres://smash-diary");
  });
});
