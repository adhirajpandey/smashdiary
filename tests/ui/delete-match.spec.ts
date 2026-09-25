import { expect, test } from "@playwright/test";

import {
  createMatchViaApi,
  createUniquePlayerName,
  deleteMatchAndExpectRedirect,
  deleteMatchViaApi,
  expectDeleteMatchModal,
  expectMatchDetail,
  expectToast,
  fillMatchScores,
  fillPlayerField,
  openDetailDeleteModal,
  openAppAndSelectPlayer,
  openMatchDetailById,
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

test("keeps the match and lets me retry when the server fails to delete it", async ({ page, request }) => {
  const opponent = createUniquePlayerName("Delete Failure Opponent ");
  const matchId = await createMatchViaApi(request, {
    sideAPlayers: ["Adhiraj"],
    sideBPlayers: [opponent],
    sideAScore: 21,
    sideBScore: 12,
  });

  await openAppAndSelectPlayer(page);
  await openMatchDetailById(page, matchId);
  await page.route(`**/api/matches/${matchId}`, async (route) => {
    if (route.request().method() !== "DELETE") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 500,
      json: { error: { code: "INTERNAL_ERROR", message: "Could not delete match." } },
    });
  });

  const { dialog } = await openDetailDeleteModal(page);
  await dialog.getByRole("button", { name: "Delete" }).click();

  await expectToast(page, { role: "alert", title: "Delete failed", description: "Could not delete match." });
  await expect(dialog).toContainText("Could not delete match.");
  await expect(dialog.getByRole("button", { name: "Delete" })).toBeEnabled();

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).not.toBeVisible();

  await page.unroute(`**/api/matches/${matchId}`);
  await page.reload();
  await expectMatchDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", opponent],
    scoreline: "21-12",
  });
});

test("shows a fallback message when delete cannot reach the server", async ({ page, request }) => {
  const matchId = await createMatchViaApi(request, {
    sideAPlayers: ["Adhiraj"],
    sideBPlayers: [createUniquePlayerName("Offline Delete Opponent ")],
    sideAScore: 21,
    sideBScore: 13,
  });

  await openAppAndSelectPlayer(page);
  await openMatchDetailById(page, matchId);
  await page.route(`**/api/matches/${matchId}`, async (route) => {
    if (route.request().method() !== "DELETE") {
      await route.fallback();
      return;
    }

    await route.abort("internetdisconnected");
  });

  const { dialog } = await openDetailDeleteModal(page);
  await dialog.getByRole("button", { name: "Delete" }).click();

  await expectToast(page, {
    role: "alert",
    title: "Delete failed",
    description: "Could not delete match. Please try again.",
  });
  await expect(dialog).toContainText("Could not delete match. Please try again.");
  await expect(page).toHaveURL(`/matches/${matchId}`);
});

test("treats deleting a match another tab already deleted as done", async ({ page, request }) => {
  const opponent = createUniquePlayerName("Already Deleted Opponent ");
  const matchId = await createMatchViaApi(request, {
    sideAPlayers: ["Adhiraj"],
    sideBPlayers: [opponent],
    sideAScore: 21,
    sideBScore: 14,
  });

  await openAppAndSelectPlayer(page);
  await openMatchDetailById(page, matchId);

  const { dialog } = await openDetailDeleteModal(page);
  await deleteMatchViaApi(request, matchId);
  await dialog.getByRole("button", { name: "Delete" }).click();

  await expectToast(page, {
    role: "status",
    title: "Match already deleted",
    description: "It was removed from another tab or device.",
  });
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL("/matches");
  await expect(page.getByRole("heading", { name: "Adhiraj's singles matches" })).toBeVisible();
  await expect(page.getByText(opponent, { exact: false })).not.toBeVisible();
});
