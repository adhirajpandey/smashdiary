import { expect, type Page } from "@playwright/test";

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

export async function submitMatchAndExpectDetail(
  page: Page,
  details: {
    formatHeading: "Singles match" | "Doubles match";
    players: string[];
    scoreline: `${number}-${number}`;
  },
) {
  await page.getByRole("button", { name: "Save Match" }).click();

  const successToast = page.getByRole("status").filter({ hasText: "Match saved" });
  await expect(successToast).toContainText("The scoreline has been added to your diary.");
  await expect(page).toHaveURL(/\/matches\/\d+$/);
  await expect(page.getByRole("heading", { name: details.formatHeading })).toBeVisible();
  await expect(page.getByText(new RegExp(details.scoreline.replace("-", "\\s*/\\s*")))).toBeVisible();

  for (const player of details.players) {
    await expect(page.getByText(player, { exact: false })).toBeVisible();
  }
}

export function createUniquePlayerName(prefix: string) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
