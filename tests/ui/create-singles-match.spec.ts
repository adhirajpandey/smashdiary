import { test } from "@playwright/test";

import {
  fillMatchScores,
  fillPlayerField,
  openAppAndSelectPlayer,
  openNewMatchForm,
  submitMatchAndExpectDetail,
} from "./helpers";

test("creates a singles match against an existing player", async ({ page }) => {
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
