import { expect, test } from "@playwright/test";

import { gotoWithSelectedPlayer, matchLink } from "./helpers";

test.describe("matches CRUD", () => {
  test("creates, edits, and deletes a singles match", async ({ page }) => {
    test.slow();
    test.setTimeout(90_000);

    await gotoWithSelectedPlayer(page, "/matches/new", "adhiraj");

    await expect(page.getByText("Adhiraj")).toBeVisible();
    await page.getByRole("textbox", { name: "Opponent" }).fill("Sanidhya");
    await page.getByRole("button", { name: "Increase your score" }).click();
    await page.getByRole("button", { name: "Decrease opponent score" }).click();
    await page.getByRole("button", { name: "Decrease opponent score" }).click();
    await page.getByRole("button", { name: "Save Match" }).click();

    await expect(page).toHaveURL(/\/$/);
    const createdMatch = matchLink(page, /Victory Adhiraj versus Sanidhya 21-18/);
    await expect(createdMatch).toBeVisible();

    await createdMatch.click();
    await page.waitForURL(/\/matches\/g_[^/]+$/);
    const createdMatchPath = new URL(page.url()).pathname;
    await expect(page.getByRole("heading", { name: "singles" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("21", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("18", { exact: true })).toBeVisible({ timeout: 15_000 });

    await Promise.all([
      page.waitForURL(/\/edit$/, { timeout: 15_000 }),
      page.getByRole("link", { name: "Edit match" }).click(),
    ]);
    await expect(page.getByRole("textbox", { name: "Side A" })).toHaveValue("Adhiraj");
    await expect(page.getByRole("textbox", { name: "Side B" })).toHaveValue("Sanidhya");

    await page.getByRole("button", { name: "Decrease opponent score" }).click();
    await page.getByRole("button", { name: "Save Match" }).click();

    await expect(page).not.toHaveURL(/\/edit$/, { timeout: 15_000 });
    await expect(page.getByText("17", { exact: true })).toBeVisible({ timeout: 15_000 });

    page.once("dialog", (dialog) => {
      void dialog.accept();
    });
    await page.getByRole("button", { name: "Delete match" }).click();

    await expect(page).toHaveURL(/\/matches$/);
    await expect(page.locator(`a[href="${createdMatchPath}"]`)).toHaveCount(0);
  });
});
