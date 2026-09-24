import { createAppConfig, getRequiredDatabaseUrl } from "@/lib/config/env";

// Next's types mark NODE_ENV as required, but createAppConfig does not read it.
function env(values: Record<string, string>) {
  return values as NodeJS.ProcessEnv;
}

describe("config env", () => {
  it("uses the expected defaults when optional values are omitted", () => {
    const config = createAppConfig(env({}));

    expect(config.ci).toBe(false);
    expect(config.databaseUrl).toBeUndefined();
    expect(config.logLevel).toBe("info");
    expect(config.playwright.port).toBe(3101);
    expect(config.playwright.baseUrl).toBe("http://127.0.0.1:3101");
    expect(config.playwright.reuseExistingServer).toBe(false);
    expect(config.playwright.nextDistDir).toBe(".next-playwright");
    expect(config.playwright.databaseUrl).toBe("postgres://postgres:postgres@127.0.0.1:5433/smashdiary");
  });

  it("parses valid runtime config values", () => {
    const config = createAppConfig(env({
      DATABASE_URL: "postgres://smash-diary",
      LOG_LEVEL: "warn",
      PLAYWRIGHT_UI_PORT: "4100",
      PLAYWRIGHT_REUSE_SERVER: "1",
      NEXT_DIST_DIR: ".next-e2e",
      CI: "1",
    }));

    expect(config.ci).toBe(true);
    expect(config.databaseUrl).toBe("postgres://smash-diary");
    expect(config.logLevel).toBe("warn");
    expect(config.playwright.port).toBe(4100);
    expect(config.playwright.baseUrl).toBe("http://127.0.0.1:4100");
    expect(config.playwright.reuseExistingServer).toBe(true);
    expect(config.playwright.nextDistDir).toBe(".next-e2e");
  });

  it("fails fast on invalid env values", () => {
    expect(() => createAppConfig(env({ LOG_LEVEL: "trace" }))).toThrow(
      'Invalid LOG_LEVEL environment variable: "trace". Expected one of debug, info, warn, error.',
    );
    expect(() => createAppConfig(env({ PLAYWRIGHT_UI_PORT: "0" }))).toThrow(
      'Invalid PLAYWRIGHT_UI_PORT environment variable: "0". Expected a positive integer.',
    );
    expect(() => createAppConfig(env({ PLAYWRIGHT_REUSE_SERVER: "yes" }))).toThrow(
      'Invalid PLAYWRIGHT_REUSE_SERVER environment variable: "yes". Expected "1", "0", or unset.',
    );
  });

  it("requires database url only when explicitly requested", () => {
    expect(() => getRequiredDatabaseUrl(createAppConfig(env({})))).toThrow(
      "Missing DATABASE_URL environment variable.",
    );
    expect(
      getRequiredDatabaseUrl(createAppConfig(env({ DATABASE_URL: "postgres://smash-diary" }))),
    ).toBe("postgres://smash-diary");
  });
});
