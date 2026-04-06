import { expect, test } from "@playwright/test";

import { expectToast, fillMatchScores, fillPlayerField, openAppAndSelectPlayer, openNewMatchForm } from "./helpers";

function addDaysToDate(value: string, days: number) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

test("shows a clear error when the final score is invalid", async ({ page }) => {
  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", "Jinu");
  await fillMatchScores(page, { yours: 20, opponent: 20 });

  await page.getByRole("button", { name: "Save Match" }).click();

  await expectToast(page, {
    role: "alert",
    title: "Check the highlighted values",
    description: "Please fix the highlighted input and try again.",
  });
  await expect(page.getByText("A final game needs one winning side.")).toBeVisible();
  await expect(page).toHaveURL("/matches/new");
});

test("shows a clear error when the match date is in the future", async ({ page }) => {
  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", "Jinu");
  await fillMatchScores(page, { yours: 21, opponent: 18 });

  const dateInput = page.locator('input[type="date"]');
  const today = await dateInput.inputValue();
  await expect(dateInput).toHaveAttribute("max", today);
  await dateInput.evaluate((input) => input.removeAttribute("max"));
  await dateInput.fill(addDaysToDate(today, 1));

  await page.getByRole("button", { name: "Save Match" }).click();

  await expectToast(page, {
    role: "alert",
    title: "Check the highlighted values",
    description: "Please fix the highlighted input and try again.",
  });
  await expect(page.getByText("Match date cannot be in the future.")).toBeVisible();
  await expect(page).toHaveURL("/matches/new");
});
