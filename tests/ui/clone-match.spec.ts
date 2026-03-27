import { expect, test } from "@playwright/test";

import {
  cloneMatchFromDetail,
  createUniquePlayerName,
  fillMatchScores,
  fillPlayerField,
  navigatePrimary,
  openAppAndSelectPlayer,
  openFirstMatchCardActions,
  openNewMatchForm,
  submitMatchAndExpectDetail,
} from "./helpers";

test("clones a saved match into a new prefilled entry", async ({ page }) => {
  const opponent = createUniquePlayerName("Clone Opponent ");

  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", opponent, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 16 });
  await submitMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", opponent],
    scoreline: "21-16",
  });

  const sourceUrl = page.url();

  await cloneMatchFromDetail(page);

  await expect(page).toHaveURL(/\/matches\/new\?cloneFrom=\d+$/);
  await expect(page.getByText("Adhiraj", { exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Opponent", exact: true })).toHaveValue(opponent);
  await expect(page.getByRole("spinbutton", { name: "Your score" })).toHaveValue("20");
  await expect(page.getByRole("spinbutton", { name: "Opponent score" })).toHaveValue("20");

  await fillMatchScores(page, { yours: 21, opponent: 19 });
  await submitMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", opponent],
    scoreline: "21-19",
  });

  await expect(page).not.toHaveURL(sourceUrl);
});

test("opens edit from the match card overflow menu", async ({ page }) => {
  const opponent = createUniquePlayerName("Card Edit Opponent ");

  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", opponent, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 18 });
  await submitMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", opponent],
    scoreline: "21-18",
  });

  await navigatePrimary(page, "Matches");
  await openFirstMatchCardActions(page);
  await page.getByRole("menuitem", { name: "Edit" }).click();

  await expect(page).toHaveURL(/\/matches\/\d+\/edit$/);
  await expect(page.getByRole("button", { name: "Update Match" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Opponent", exact: true })).toHaveValue(opponent);
});
