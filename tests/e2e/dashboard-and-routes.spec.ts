import { expect, test } from "@playwright/test";

import { gotoWithSelectedPlayer, matchLink } from "./helpers";

test.describe("dashboard, stats, and redirects", () => {
  test("shows personalized dashboard data for the selected player", async ({ page }) => {
    await gotoWithSelectedPlayer(page, "/", "adhiraj");

    await expect(page.getByRole("heading", { name: "Your Activity" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("7.3")).toBeVisible({ timeout: 15_000 });
    await expect(matchLink(page, /Victory Adhiraj Sanidhya versus Abhishek Sankalp 21-9/)).toBeVisible();
  });

  test("shows personalized stats and matches views", async ({ page }) => {
    await gotoWithSelectedPlayer(page, "/stats", "adhiraj");

    await expect(page.getByRole("heading", { name: "Adhiraj's court pulse." })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("37")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("27")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: "Matches" }).click();
    await expect(page).toHaveURL(/\/matches$/);
    await expect(page.getByRole("heading", { name: "Adhiraj's matches" })).toBeVisible();
    await matchLink(page, /Victory Adhiraj Sanidhya versus Abhishek Sankalp 21-9/).waitFor();
  });

  test("resolves redirect routes to supported pages", async ({ page }) => {
    test.slow();
    test.setTimeout(90_000);

    await page.addInitScript(
      ({ key, value }) => {
        window.localStorage.setItem(key, value);
      },
      { key: "smash-diary:selected-player:v1", value: "p3" },
    );
    await page.goto("/rankings");
    await page.waitForURL(/\/stats$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "Adhiraj's court pulse." })).toBeVisible();

    await page.goto("/games/new");
    await page.waitForURL(/\/matches\/new$/, { timeout: 15_000 });
    await expect(page.getByText("Select format")).toBeVisible({ timeout: 15_000 });

    await page.goto("/games/g38");
    await page.waitForURL(/\/matches\/g38$/, { timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "doubles" })).toBeVisible({ timeout: 15_000 });
  });
});
