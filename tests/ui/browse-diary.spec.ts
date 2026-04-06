import { expect, test } from "@playwright/test";

import { navigatePrimary, openAppAndSelectPlayer, openExistingMatchDetail } from "./helpers";

test("opens the identity player list before focusing search", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const searchInput = page.getByRole("combobox", { name: "Select player", exact: true });
  await expect(searchInput).toBeVisible();

  await searchInput.click();
  await expect(page.getByRole("option", { name: "Adhiraj", exact: true })).toBeVisible();
  await expect(searchInput).not.toBeFocused();

  await searchInput.click();
  await searchInput.fill("Adhiraj");
  await page.getByRole("option", { name: "Adhiraj", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("button", { name: "Open player identity picker for Adhiraj" })).toBeVisible();
});

test("lets me browse my diary and open a saved match", async ({ page }) => {
  await openAppAndSelectPlayer(page);

  await expect(page.getByText("Win rate")).toBeVisible();
  await expect(page.getByText("Player rating")).toBeVisible();

  await navigatePrimary(page, "Matches");
  await expect(page.getByRole("heading", { name: "Adhiraj's singles matches" })).toBeVisible();

  await navigatePrimary(page, "Stats");
  await expect(page.getByRole("heading", { name: "Adhiraj's singles stats" })).toBeVisible();

  await navigatePrimary(page, "Matches");
  await openExistingMatchDetail(page, "Singles match: Adhiraj versus Sanidhya, score 21-17");

  await expect(page.getByRole("heading", { name: "Singles match" })).toBeVisible();
  await expect(page.getByText(/21\s*\/\s*17/)).toBeVisible();
  await expect(page.getByText("Adhiraj", { exact: false })).toBeVisible();
  await expect(page.getByText("Sanidhya", { exact: false })).toBeVisible();
});
