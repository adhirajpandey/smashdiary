import { expect, test } from "@playwright/test";

import {
  cloneMatchFromDetail,
  createUniquePlayerName,
  expectDashboardMatchCardMenuNotClipped,
  expectDeleteMatchModal,
  fillMatchScores,
  fillPlayerField,
  navigatePrimary,
  openAppAndSelectPlayer,
  openFirstMatchCardActions,
  openFirstMatchCardDeleteModal,
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

test("keeps a selected doubles slot-2 player as You when cloning a saved match", async ({ page }) => {
  await openAppAndSelectPlayer(page, "Sachi");
  await page.goto("/matches/14");
  await page.waitForLoadState("networkidle");

  await cloneMatchFromDetail(page);

  await expect(page).toHaveURL(/\/matches\/new\?cloneFrom=14$/);
  await expect(page.locator(".match-input-shell.is-readonly .match-input-shell__value")).toHaveText("Sachi");
  await expect(page.getByRole("combobox", { name: "Your Partner", exact: true })).toHaveValue("Adhiraj");
  await expect(page.getByRole("combobox", { name: "Opponent", exact: true })).toHaveValue("EASGuy A");
  await expect(page.getByRole("combobox", { name: "Opponent's Partner", exact: true })).toHaveValue("Abhilasha");

  await fillMatchScores(page, { yours: 21, opponent: 19 });

  const saveRequestPromise = page.waitForRequest(
    (request) => request.method() === "POST" && request.url().endsWith("/api/matches"),
  );

  await submitMatchAndExpectDetail(page, {
    formatHeading: "Doubles match",
    players: ["Sachi", "Adhiraj", "EASGuy A", "Abhilasha"],
    scoreline: "21-19",
  });

  const saveRequest = await saveRequestPromise;

  expect(JSON.parse(saveRequest.postData() ?? "{}")).toMatchObject({
    format: "doubles",
    sideAPlayers: ["Sachi", "Adhiraj"],
    sideBPlayers: ["EASGuy A", "Abhilasha"],
    sideAScore: 21,
    sideBScore: 19,
  });
});

test("opens edit from the match card overflow menu", async ({ page }) => {
  const opponent = createUniquePlayerName("Card Action Opponent ");

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
  const { menu: matchesMenu } = await openFirstMatchCardActions(page, opponent);
  await matchesMenu.getByText("EDIT", { exact: true }).click();

  await expect(page).toHaveURL(/\/matches\/\d+\/edit$/);
  await expect(page.getByRole("button", { name: "Update Match" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Opponent", exact: true })).toHaveValue(opponent);
});

test("opens edit from dashboard recent matches without clipping the overflow menu", async ({ page }) => {
  const opponent = createUniquePlayerName("Overflow Probe Opponent ");

  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", opponent, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 17 });
  await submitMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", opponent],
    scoreline: "21-17",
  });

  await navigatePrimary(page, "Dashboard");
  const { card: dashboardCard, menu: dashboardMenu } = await openFirstMatchCardActions(page);
  await expectDashboardMatchCardMenuNotClipped(page, dashboardCard, dashboardMenu);
  await dashboardMenu.getByText("EDIT", { exact: true }).click();

  await expect(page).toHaveURL(/\/matches\/\d+\/edit$/);
  await expect(page.getByRole("button", { name: "Update Match" })).toBeVisible();
});

test("uses the same centered delete confirmation from match cards on matches and dashboard", async ({ page }) => {
  const opponent = createUniquePlayerName("Shared Delete Opponent ");

  await openAppAndSelectPlayer(page);
  await openNewMatchForm(page);
  await fillPlayerField(page, "Opponent", opponent, { selectSuggestion: false });
  await fillMatchScores(page, { yours: 21, opponent: 13 });
  await submitMatchAndExpectDetail(page, {
    formatHeading: "Singles match",
    players: ["Adhiraj", opponent],
    scoreline: "21-13",
  });

  await navigatePrimary(page, "Dashboard");
  const { dialog: dashboardDialog, trigger: dashboardTrigger } = await openFirstMatchCardDeleteModal(page);
  await expectDeleteMatchModal(page);
  await dashboardDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dashboardDialog).not.toBeVisible();
  await expect(dashboardTrigger).toBeFocused();

  await navigatePrimary(page, "Matches");
  const { dialog: matchesDialog, trigger: matchesTrigger } = await openFirstMatchCardDeleteModal(page, opponent);
  await matchesDialog.getByRole("button", { name: "Cancel" }).click();
  await expect(matchesDialog).not.toBeVisible();
  await expect(matchesTrigger).toBeFocused();
});
