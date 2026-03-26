import { expect, test } from "@playwright/test";

import { navigatePrimary, openAppAndSelectPlayer } from "./helpers";

test("selects a player, browses core screens, and opens a seeded match", async ({ page }) => {
  await openAppAndSelectPlayer(page);

  await expect(page.getByText("Win rate")).toBeVisible();
  await expect(page.getByText("Player rating")).toBeVisible();

  await navigatePrimary(page, "Matches");
  await expect(page.getByRole("heading", { name: "Adhiraj's matches" })).toBeVisible();

  await navigatePrimary(page, "Stats");
  await expect(page.getByRole("heading", { name: "Adhiraj's stats" })).toBeVisible();

  await navigatePrimary(page, "Matches");
  await page
    .getByRole("link", {
      name: "Doubles match: Adhiraj and Sanidhya versus Abhishek and Sankalp, score 21-9",
    })
    .click();

  await expect(page).toHaveURL(/\/matches\/\d+$/);
  await expect(page.getByRole("heading", { name: "Doubles match" })).toBeVisible();
  await expect(page.getByText(/21\s*\/\s*9/)).toBeVisible();
  await expect(page.getByText("Adhiraj", { exact: false })).toBeVisible();
  await expect(page.getByText("Sanidhya", { exact: false })).toBeVisible();
});
