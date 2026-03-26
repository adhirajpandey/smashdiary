import { expect, test } from "@playwright/test";

import { chooseIdentity, expectProfileBadge, gotoWithSelectedPlayer, players } from "./helpers";

test.describe("identity selection", () => {
  test("prompts for identity on first visit and persists the selection after reload", async ({ page }) => {
    await page.goto("/");

    await chooseIdentity(page, players.adhiraj.name, players.adhiraj.badge);
    await expect(page.getByRole("heading", { name: "Your Activity" })).toBeVisible();

    await page.reload();
    await expectProfileBadge(page, players.adhiraj.badge, 15_000);
    await expect(page.getByRole("heading", { name: "Your Activity" })).toBeVisible();
  });

  test("lets the user switch identity from the profile button", async ({ page }) => {
    await gotoWithSelectedPlayer(page, "/", "sagar");
    await expect(page.getByText("5.5")).toBeVisible();

    await page.getByRole("button", { name: players.sagar.badge, exact: true }).click();
    await chooseIdentity(page, players.adhiraj.name, players.adhiraj.badge);

    await expectProfileBadge(page, players.adhiraj.badge);
    await expect(page.getByText("7.3")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Your Activity" })).toBeVisible();
  });
});
