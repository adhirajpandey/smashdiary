import { appConfig } from "@/lib/config/env";

export function isTestMode() {
  return appConfig.isTestMode;
}
