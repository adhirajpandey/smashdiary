import { expect, test } from "@playwright/test";

import { expectToast, fillMatchScores, fillPlayerField, openAppAndSelectPlayer, openNewMatchForm } from "./helpers";

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
