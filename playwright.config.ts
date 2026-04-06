import { defineConfig, devices } from "@playwright/test";

import { appConfig } from "@/lib/config/env";

const uiTestPort = appConfig.playwright.port;
const uiTestBaseUrl = appConfig.playwright.baseUrl;
const shouldReuseExistingServer = appConfig.playwright.reuseExistingServer;

export default defineConfig({
  testDir: "./tests/ui",
  fullyParallel: false,
  timeout: 60 * 1000,
  retries: appConfig.ci ? 2 : 0,
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
    command: `cross-env APP_MODE=test NEXT_DIST_DIR=${appConfig.playwright.nextDistDir} PORT=${uiTestPort} next dev --port ${uiTestPort}`,
    url: uiTestBaseUrl,
    reuseExistingServer: shouldReuseExistingServer,
    timeout: 120 * 1000,
  },
});
