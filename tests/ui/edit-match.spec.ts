import { expect, test } from "@playwright/test";

import type { PlayersData } from "@/lib/view-models";

import {
  createMatchViaApi,
  createUniquePlayerName,
  deleteMatchViaApi,
  expectToast,
  fillMatchScores,
  fillPlayerField,
  openAppAndSelectPlayer,
  openEditMatchForm,
  openMatchDetailById,
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

test("sends me back to my matches when another tab deleted the match I am editing", async ({ page, request }) => {
  const opponent = createUniquePlayerName("Vanished Opponent ");
  const replacementOpponent = createUniquePlayerName("Unsaved Opponent ");
  const matchId = await createMatchViaApi(request, {
    sideAPlayers: ["Adhiraj"],
    sideBPlayers: [opponent],
    sideAScore: 21,
    sideBScore: 17,
  });

  await openAppAndSelectPlayer(page);
  await openMatchDetailById(page, matchId);
  await openEditMatchForm(page);

  await deleteMatchViaApi(request, matchId);
  await fillPlayerField(page, "Opponent", replacementOpponent, { selectSuggestion: false });
  await page.getByRole("button", { name: "Update Match" }).click();

  await expectToast(page, {
    role: "status",
    title: "Match was deleted",
    description: "Another tab or device deleted this match, so your changes weren't saved.",
  });
  await expect(page).toHaveURL("/matches");
  await expect(page.getByText(opponent, { exact: false })).not.toBeVisible();

  const playersResponse = await request.get("/api/players");
  const { data } = (await playersResponse.json()) as { data: PlayersData };
  expect(data.players.map((player) => player.name)).not.toContain(replacementOpponent);
});
