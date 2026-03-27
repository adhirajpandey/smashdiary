import { expect, type Page } from "@playwright/test";

type MatchDetails = {
  formatHeading: "Singles match" | "Doubles match";
  players: string[];
  scoreline: `${number}-${number}`;
};

export async function openAppAndSelectPlayer(page: Page, playerName = "Adhiraj") {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const pickerToggle = page.getByRole("button", { name: /select player/i });

  try {
    await expect(pickerToggle).toBeVisible({ timeout: 10_000 });
  } catch {
    await page.getByRole("button", { name: "Open player identity picker" }).click();
    await expect(pickerToggle).toBeVisible({ timeout: 5_000 });
  }

  await page.getByText("Who are you?").waitFor({ state: "visible" });
  await pickerToggle.click();
  await page.getByRole("option", { name: playerName, exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page.getByRole("button", { name: `Open player identity picker for ${playerName}` })).toBeVisible();
  await expect(page.getByRole("link", { name: "Add a Match" })).toBeVisible();
}

export async function navigatePrimary(page: Page, label: "Dashboard" | "Matches" | "Stats") {
  await page.getByRole("link", { name: label, exact: true }).click();
  await page.waitForLoadState("networkidle");
}

export async function openNewMatchForm(page: Page) {
  await page.getByRole("link", { name: "Add a Match" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "Save Match" })).toBeVisible();
}

export async function openExistingMatchDetail(page: Page, matchLinkName: string) {
  await page.getByRole("link", { name: matchLinkName }).click();
  await expect(page).toHaveURL(/\/matches\/\d+$/);
}

export async function fillPlayerField(
  page: Page,
  label: "Your Partner" | "Opponent" | "Opponent's Partner",
  value: string,
  options?: { selectSuggestion?: boolean },
) {
  const field = page.getByRole("combobox", { name: label, exact: true });
  await field.fill(value);

  if (options?.selectSuggestion === false) {
    await field.press("Tab");
    return;
  }

  await page.getByRole("option").filter({ hasText: value }).first().click();
}

export async function fillMatchScores(page: Page, scores: { yours: number; opponent: number }) {
  await page.getByRole("spinbutton", { name: "Your score" }).fill(String(scores.yours));
  await page.getByRole("spinbutton", { name: "Opponent score" }).fill(String(scores.opponent));
}

export async function expectToast(
  page: Page,
  options: {
    role: "status" | "alert";
    title: string;
    description?: string;
  },
) {
  const toast = page.getByRole(options.role).filter({ hasText: options.title });
  await expect(toast).toContainText(options.title);

  if (options.description) {
    await expect(toast).toContainText(options.description);
  }
}

export async function expectMatchDetail(page: Page, details: MatchDetails) {
  await expect(page).toHaveURL(/\/matches\/\d+$/);
  await expect(page.getByRole("heading", { name: details.formatHeading })).toBeVisible();
  await expect(page.getByText(new RegExp(details.scoreline.replace("-", "\\s*/\\s*")))).toBeVisible();

  for (const player of details.players) {
    const playerParts = player.trim().split(/\s+/).filter(Boolean);

    for (const part of playerParts) {
      await expect(page.getByText(part, { exact: true })).toBeVisible();
    }
  }
}

export async function submitMatchAndExpectDetail(page: Page, details: MatchDetails) {
  await page.getByRole("button", { name: "Save Match" }).click();

  await expectToast(page, {
    role: "status",
    title: "Match saved",
    description: "The scoreline has been added to your diary.",
  });
  await expectMatchDetail(page, details);
}

export async function openEditMatchForm(page: Page) {
  await page.getByRole("button", { name: "Open match actions" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "Update Match" })).toBeVisible();
}

export async function cloneMatchFromDetail(page: Page) {
  await page.getByRole("button", { name: "Open match actions" }).click();
  await page.getByRole("menuitem", { name: "Clone" }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "Save Match" })).toBeVisible();
}

export async function openFirstMatchCardActions(page: Page) {
  await page.locator(".match-feed .dashboard-match").first().getByRole("button", { name: "Open match actions" }).click();
}

export async function updateMatchAndExpectDetail(page: Page, details: MatchDetails) {
  await page.getByRole("button", { name: "Update Match" }).click();

  await expectToast(page, {
    role: "status",
    title: "Match updated",
    description: "The refreshed scoreline is live in your diary.",
  });
  await expectMatchDetail(page, details);
}

export async function deleteMatchAndExpectRedirect(page: Page) {
  await page.getByRole("button", { name: "Delete match" }).click();
  await expect(page.getByText("Remove this saved match?")).toBeVisible();
  await page.getByRole("button", { name: "Confirm delete" }).click();

  await expectToast(page, {
    role: "status",
    title: "Match deleted",
    description: "The saved scoreline has been cleared from your diary.",
  });
  await expect(page).toHaveURL("/matches");
}

export function createUniquePlayerName(prefix: string) {
  const suffix = `${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 4)}`;
  return `${prefix}${suffix}`;
}
