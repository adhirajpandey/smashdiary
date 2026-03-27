import { defineConfig, devices } from "@playwright/test";

const uiTestPort = Number(process.env.PLAYWRIGHT_UI_PORT ?? "3101");
const uiTestBaseUrl = `http://127.0.0.1:${uiTestPort}`;
const shouldReuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "1";

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  timeout: 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  workers: 3,
  reporter: "list",
  use: {
    baseURL: uiTestBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      use: {
        ...devices["Pixel 6"],
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `cross-env APP_MODE=test NEXT_DIST_DIR=.next-playwright PORT=${uiTestPort} next dev --port ${uiTestPort}`,
    url: uiTestBaseUrl,
    reuseExistingServer: shouldReuseExistingServer,
    timeout: 120 * 1000,
  },
});
