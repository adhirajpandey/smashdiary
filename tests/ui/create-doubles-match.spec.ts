import { test } from "@playwright/test";

import {
  createMatchViaApi,
  createUniquePlayerName,
  fillMatchScores,
  fillPlayerField,
  openAppAndSelectPlayer,
  openNewMatchForm,
  submitMatchAndExpectDetail,
} from "./helpers";

test("lets me record a doubles match with a new opponent", async ({ page, request }) => {
  const partner = createUniquePlayerName("Partner");
  const opponent = createUniquePlayerName("Rival");
  const newOpponentPartner = createUniquePlayerName("New Opponent ");
  await createMatchViaApi(request, {
    sideAPlayers: [partner],
    sideBPlayers: [opponent],
    sideAScore: 21,
    sideBScore: 10,
  });

  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await page.getByRole("button", { name: /doubles/i }).click();
  await fillPlayerField(page, "Your Partner", partner);
  await fillPlayerField(page, "Opponent", opponent);
  await fillPlayerField(page, "Opponent's Partner", newOpponentPartner, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 14 });

  await submitMatchAndExpectDetail(page, {
    formatHeading: "Doubles match",
    players: ["Adhiraj", partner, opponent, newOpponentPartner],
    scoreline: "21-14",
  });
});
