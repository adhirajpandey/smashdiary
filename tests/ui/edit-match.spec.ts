import { test } from "@playwright/test";

import {
  createUniquePlayerName,
  fillMatchScores,
  fillPlayerField,
  openAppAndSelectPlayer,
  openEditMatchForm,
  openNewMatchForm,
  submitMatchAndExpectDetail,
  updateMatchAndExpectDetail,
} from "./helpers";

test("lets me correct a saved match", async ({ page }) => {
  const initialOpponent = createUniquePlayerName("Edited Opponent ");
  const updatedOpponent = createUniquePlayerName("Updated Opponent ");

  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", initialOpponent, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 16 });

  await submitMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", initialOpponent],
    scoreline: "21-16",
  });

  await openEditMatchForm(page);
  await fillPlayerField(page, "Opponent", updatedOpponent, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 18 });

  await updateMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", updatedOpponent],
    scoreline: "21-18",
  });
});
