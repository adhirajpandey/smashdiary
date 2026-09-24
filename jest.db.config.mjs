import baseConfig from "./jest.config.cjs";

/** @type {import('jest').Config} */
const config = {
  ...baseConfig,
  testMatch: ["**/*.db.test.ts"],
  testPathIgnorePatterns: ["/node_modules/"],
  globalSetup: "<rootDir>/tests/db/global-setup.mjs",
  setupFiles: ["<rootDir>/tests/db/env.cjs"],
};

export default config;
