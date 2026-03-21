export function isTestMode() {
  return process.env.APP_MODE === "test";
}
