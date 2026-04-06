import { expect, test } from "@playwright/test";

import {
  createUniquePlayerName,
  deleteMatchAndExpectRedirect,
  expectDeleteMatchModal,
  fillMatchScores,
  fillPlayerField,
  openDetailDeleteModal,
  openAppAndSelectPlayer,
  openNewMatchForm,
  submitMatchAndExpectDetail,
} from "./helpers";

test("lets me delete a saved match", async ({ page }) => {
  const opponent = createUniquePlayerName("Deleted Opponent ");

  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", opponent, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 15 });

  await submitMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", opponent],
    scoreline: "21-15",
  });

  await deleteMatchAndExpectRedirect(page, { cancelFirst: true });

  await expect(page.getByRole("heading", { name: "Adhiraj's singles matches" })).toBeVisible();
  await expect(page.getByText(opponent, { exact: false })).not.toBeVisible();
});

test("restores focus to the detail actions trigger when dismissing delete with Escape", async ({ page }) => {
  const opponent = createUniquePlayerName("Escape Dismiss Opponent ");

  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", opponent, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 11 });

  await submitMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", opponent],
    scoreline: "21-11",
  });

  const { dialog, trigger } = await openDetailDeleteModal(page);

  await expectDeleteMatchModal(page);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
