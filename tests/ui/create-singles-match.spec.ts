import { expect, test } from "@playwright/test";

import {
  fillMatchScores,
  fillPlayerField,
  openAppAndSelectPlayer,
  openNewMatchForm,
  submitMatchAndExpectDetail,
} from "./helpers";

test("opens the player list before focusing the search input", async ({ page }) => {
  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);

  const searchInput = page.getByRole("combobox", { name: "Opponent", exact: true });

  await searchInput.click();
  await expect(page.getByRole("option").first()).toBeVisible();
  await expect(searchInput).not.toBeFocused();

  await searchInput.click();
  await expect(searchInput).toBeFocused();
});

test("lets me record a singles win", async ({ page }) => {
  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", "Jinu");
  await fillMatchScores(page, { yours: 21, opponent: 17 });

  await submitMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", "Jinu"],
    scoreline: "21-17",
  });
});
