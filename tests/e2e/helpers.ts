import { expect, type Locator, type Page } from "@playwright/test";

export const STORAGE_KEY = "smash-diary:selected-player:v1";

export const players = {
  adhiraj: { id: "p3", name: "Adhiraj", badge: "A" },
  sagar: { id: "p10", name: "Sagar", badge: "S" },
  sanidhya: { id: "p11", name: "Sanidhya", badge: "S" },
} as const;

type PlayerKey = keyof typeof players;

export async function seedSelectedPlayer(page: Page, playerKey: PlayerKey) {
  const player = players[playerKey];
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: player.id },
  );
}

export async function gotoWithSelectedPlayer(page: Page, path: string, playerKey: PlayerKey) {
  const player = players[playerKey];
  await seedSelectedPlayer(page, playerKey);
  await page.goto(path);
  await expectProfileBadge(page, player.badge, 15_000);
  return player;
}

export async function expectProfileBadge(page: Page, badge: string, timeout = 5_000) {
  await expect(page.getByRole("button", { name: badge, exact: true })).toBeVisible({ timeout });
}

export async function chooseIdentity(page: Page, playerName: string, expectedBadge: string) {
  await expect(page.getByRole("heading", { name: "Who are you?" })).toBeVisible();
  await page.getByRole("button", { name: "Select player" }).click();
  await page.getByRole("button", { name: playerName, exact: true }).click();
  await page.getByRole("heading", { name: "Who are you?" }).click();
  await page.getByRole("button", { name: "Continue" }).click({ force: true });
  await expectProfileBadge(page, expectedBadge);
}

export async function expectStatusHeading(page: Page, heading: string) {
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
}

export function matchLink(page: Page, text: RegExp | string): Locator {
  return page.getByRole("link", { name: text });
}
