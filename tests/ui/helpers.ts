import { expect, type Locator, type Page } from "@playwright/test";

type MatchDetails = {
  formatHeading: "Singles match" | "Doubles match";
  players: string[];
  scoreline: `${number}-${number}`;
};

function padScoreSegment(value: string) {
  return value.padStart(2, "0");
}

function buildDetailScorelinePattern(scoreline: `${number}-${number}`) {
  const [sideA, sideB] = scoreline.split("-");
  return new RegExp(`${padScoreSegment(sideA)}\\s*\\/\\s*${padScoreSegment(sideB)}`);
}

export async function openAppAndSelectPlayer(page: Page, playerName = "Adhiraj") {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  try {
    await expect(page.getByText("Who are you?")).toBeVisible({ timeout: 10_000 });
  } catch {
    await page.getByRole("button", { name: "Open player identity picker" }).click();
    await expect(page.getByText("Who are you?")).toBeVisible({ timeout: 5_000 });
  }

  const pickerField = page.getByRole("combobox", { name: "Select player", exact: true });
  await pickerField.click();
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
  const searchInput = page.getByRole("combobox", { name: label, exact: true });
  await searchInput.click();
  await searchInput.fill(value);

  if (options?.selectSuggestion === false) {
    await searchInput.press("Tab");
    return;
  }

  await page.getByRole("option").filter({ hasText: value }).first().click();
}

export async function expectPlayerFieldValue(
  page: Page,
  label: "Your Partner" | "Opponent" | "Opponent's Partner",
  value: string,
) {
  await expect(page.getByRole("combobox", { name: label, exact: true })).toHaveValue(value);
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

async function dismissVisibleToasts(page: Page) {
  const dismissButtons = page.getByRole("button", { name: /dismiss /i });
  const count = await dismissButtons.count();

  for (let index = 0; index < count; index += 1) {
    const button = dismissButtons.nth(index);

    if (await button.isVisible()) {
      await button.click();
    }
  }
}

export async function expectMatchDetail(page: Page, details: MatchDetails) {
  await expect(page).toHaveURL(/\/matches\/\d+$/);
  await expect(page.getByRole("heading", { name: details.formatHeading })).toBeVisible();
  await expect(page.getByText(buildDetailScorelinePattern(details.scoreline))).toBeVisible();
  await expect(page.locator(".detail-stage__side-score")).toHaveCount(0);

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

async function expectMatchActionsMenu(menu: Locator) {
  await expect(menu).toBeVisible();
  await expect(menu.locator(".match-actions__item")).toHaveCount(3);
  await expect(menu.locator(".match-actions__item")).toHaveText(["CLONE", "EDIT", "DELETE"]);
}

async function openMatchActionsMenu(trigger: Locator, menu: Locator) {
  await expect
    .poll(
      async () => {
        if ((await trigger.getAttribute("aria-expanded")) === "true") {
          return true;
        }

        await trigger.click();
        return (await trigger.getAttribute("aria-expanded")) === "true";
      },
      {
        message: "Expected match actions trigger to open its menu.",
      },
    )
    .toBe(true);

  await expectMatchActionsMenu(menu);
}

function getRectRight(box: { x: number; width: number }) {
  return box.x + box.width;
}

function getRectBottom(box: { y: number; height: number }) {
  return box.y + box.height;
}

function getRectIntersection(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number },
) {
  const left = Math.max(first.x, second.x);
  const top = Math.max(first.y, second.y);
  const right = Math.min(getRectRight(first), getRectRight(second));
  const bottom = Math.min(getRectBottom(first), getRectBottom(second));

  if (right <= left || bottom <= top) {
    return null;
  }

  return { left, top, right, bottom };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getOverlapProbePoints(
  intersection: { left: number; top: number; right: number; bottom: number },
  menuBox: { x: number; y: number; width: number; height: number },
) {
  const minX = intersection.left + 1;
  const maxX = intersection.right - 1;
  const minY = intersection.top + 1;
  const maxY = intersection.bottom - 1;

  if (minX > maxX || minY > maxY) {
    return [];
  }

  const probeXValues = [
    clamp(menuBox.x + 20, minX, maxX),
    clamp((intersection.left + intersection.right) / 2, minX, maxX),
    clamp(menuBox.x + Math.min(menuBox.width / 2, 40), minX, maxX),
  ];
  const probeYValues = [
    clamp(menuBox.y + 20, minY, maxY),
    clamp((intersection.top + intersection.bottom) / 2, minY, maxY),
    clamp(menuBox.y + Math.min(menuBox.height / 2, 40), minY, maxY),
  ];

  return probeXValues.flatMap((x) => probeYValues.map((y) => ({ x, y })));
}

export async function expectDeleteMatchModal(page: Page) {
  const dialog = page.getByRole("alertdialog");

  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(dialog).toContainText("Remove this saved match?");
  await expect(dialog).toContainText("This deletes the saved scoreline and roster mapping. Player records stay intact.");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Delete" })).toBeVisible();

  const dialogBox = await dialog.boundingBox();
  const viewport = page.viewportSize();

  expect(dialogBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport!.width);
  expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewport!.height);

  return dialog;
}

export async function openDetailMatchActions(page: Page) {
  const actions = page.locator(".detail-page__actions");
  const trigger = actions.getByRole("button", { name: "Open match actions" });
  const menu = actions.locator(".match-actions__menu");
  await openMatchActionsMenu(trigger, menu);

  return { actions, menu, trigger };
}

export async function openEditMatchForm(page: Page) {
  const { menu } = await openDetailMatchActions(page);

  await menu.getByText("EDIT", { exact: true }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "Update Match" })).toBeVisible();
}

export async function cloneMatchFromDetail(page: Page) {
  const { menu } = await openDetailMatchActions(page);

  await menu.getByText("CLONE", { exact: true }).click();
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("button", { name: "Save Match" })).toBeVisible();
}

export async function openFirstMatchCardActions(page: Page, matchText?: string) {
  const cards = page.locator(".match-feed .dashboard-match");
  const card = matchText ? cards.filter({ hasText: matchText }).first() : cards.first();
  const trigger = card.getByRole("button", { name: "Open match actions" });

  await expect(card).toBeVisible();
  await dismissVisibleToasts(page);
  await expect
    .poll(
      async () => {
        try {
          await card.scrollIntoViewIfNeeded();
          return await trigger.isVisible();
        } catch {
          return false;
        }
      },
      {
        message: "Expected the first match card actions trigger to stay attached while opening.",
      },
    )
    .toBe(true);

  const menu = card.locator(".match-actions__menu");
  await openMatchActionsMenu(trigger, menu);

  return { card, menu, trigger };
}

export async function expectDashboardMatchCardMenuNotClipped(page: Page, card: Locator, menu: Locator) {
  const cards = page.locator(".match-feed .dashboard-match");
  let cardBox: { x: number; y: number; width: number; height: number } | null = null;
  let menuBox: { x: number; y: number; width: number; height: number } | null = null;

  await expect
    .poll(
      async () => {
        cardBox = await card.boundingBox();
        return cardBox !== null;
      },
      {
        message: "Expected dashboard match card bounding box to be available.",
      },
    )
    .toBe(true);
  await expect
    .poll(
      async () => {
        menuBox = await menu.boundingBox();
        return menuBox !== null;
      },
      {
        message: "Expected opened dashboard match menu bounding box to be available.",
      },
    )
    .toBe(true);

  expect(cardBox).not.toBeNull();
  expect(menuBox).not.toBeNull();
  expect(getRectBottom(menuBox!)).toBeGreaterThan(getRectBottom(cardBox!));

  const cardsCount = await cards.count();

  if (cardsCount <= 1) {
    return;
  }

  for (let index = 0; index < cardsCount; index += 1) {
    const candidateCard = cards.nth(index);
    const candidateBox = await candidateCard.boundingBox();

    if (!candidateBox || candidateBox.y <= cardBox!.y) {
      continue;
    }

    const intersection = getRectIntersection(menuBox!, candidateBox);

    if (!intersection) {
      continue;
    }

    const probePoints = getOverlapProbePoints(intersection, menuBox!);

    const hitTargetRef = await page.evaluate(
      (points) => {
        for (const point of points) {
          const element = document.elementFromPoint(point.x, point.y);

          if (!element) {
            continue;
          }

          const className = element.closest(".match-actions__menu, .match-actions__item")?.className ?? null;

          if (className) {
            return className;
          }
        }

        return null;
      },
      probePoints,
    );

    if (!hitTargetRef) {
      continue;
    }

    expect(hitTargetRef).toMatch(/match-actions__(menu|item)/);
    break;
  }
}

export async function openFirstMatchCardDeleteModal(page: Page, matchText?: string) {
  const { menu, trigger } = await openFirstMatchCardActions(page, matchText);

  await menu.getByText("DELETE", { exact: true }).click();
  const dialog = await expectDeleteMatchModal(page);

  return { dialog, trigger };
}

export async function openDetailDeleteModal(page: Page) {
  const { menu, trigger } = await openDetailMatchActions(page);

  await menu.getByText("DELETE", { exact: true }).click();
  const dialog = await expectDeleteMatchModal(page);

  return { dialog, trigger };
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

export async function deleteMatchAndExpectRedirect(page: Page, options?: { cancelFirst?: boolean }) {
  const trigger = page.locator(".detail-page__actions").getByRole("button", { name: "Open match actions" });

  if (options?.cancelFirst) {
    const { dialog } = await openDetailDeleteModal(page);
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }

  const { dialog } = await openDetailDeleteModal(page);
  await dialog.getByRole("button", { name: "Delete" }).click();

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
