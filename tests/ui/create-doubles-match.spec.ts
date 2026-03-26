import { test } from "@playwright/test";

import {
  createUniquePlayerName,
  fillMatchScores,
  fillPlayerField,
  openAppAndSelectPlayer,
  openNewMatchForm,
  submitMatchAndExpectDetail,
} from "./helpers";

test("lets me record a doubles match with a new opponent", async ({ page }) => {
  const newOpponentPartner = createUniquePlayerName("New Opponent ");

  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await page.getByRole("button", { name: /doubles/i }).click();
  await fillPlayerField(page, "Your Partner", "Sachi");
  await fillPlayerField(page, "Opponent", "Amar");
  await fillPlayerField(page, "Opponent's Partner", newOpponentPartner, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 14 });

  await submitMatchAndExpectDetail(page, {
    formatHeading: "Doubles match",
    players: ["Adhiraj", "Sachi", "Amar", newOpponentPartner],
    scoreline: "21-14",
  });
});
