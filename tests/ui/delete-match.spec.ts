import { expect, test } from "@playwright/test";

import {
  createUniquePlayerName,
  deleteMatchAndExpectRedirect,
  fillMatchScores,
  fillPlayerField,
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

  await deleteMatchAndExpectRedirect(page);

  await expect(page.getByRole("heading", { name: "Adhiraj's matches" })).toBeVisible();
  await expect(page.getByText(opponent, { exact: false })).not.toBeVisible();
});
