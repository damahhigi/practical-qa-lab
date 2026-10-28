import { test, expect, type Page } from '@playwright/test';

const url = '/learning-paths/?path=automation';
const key = 'practicalQaLab.progress.v1';

function moduleSession(number: number, answers = 'cccc') {
  return {
    id: `automation-m${number}-${answers}`,
    type: 'practice',
    area: 'automation',
    score: 100,
    maxScore: 100,
    completedAt: '2026-10-26T10:00:00.000Z',
    questionScores: [20, 25, 25, 30]
  };
}

const capstone = {
  id: 'automation-capstone-v1-' + '1'.repeat(20),
  type: 'practice',
  area: 'automation',
  score: 100,
  maxScore: 100,
  completedAt: '2026-10-27T10:00:00.000Z',
  questionScores: [15, 20, 20, 15, 15, 15]
};

async function seed(page: Page, sessions: unknown[]) {
  await page.evaluate(({ key, sessions }) => {
    localStorage.setItem(key, JSON.stringify(sessions));
  }, { key, sessions });

  await page.reload();
}

test.describe('v1.6 Connected Automation Learning Path', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(url);
  });

  test('displays seven activities and the correct links', async ({ page }) => {
    await expect(page.locator('[data-path]')).toHaveCount(4);

    await expect(page.locator('[data-path="automation"]'))
      .toHaveAttribute('aria-pressed', 'true');

    await expect(page.locator('#detailsCount'))
      .toHaveText('0/7');

    await expect(page.locator('#stepList li'))
      .toHaveCount(7);

    await expect(page.locator('#stepList li').first())
      .toContainText('Playwright Fundamentals');

    await expect(page.locator('#stepList li').last())
      .toContainText('ShopFlow Automation Capstone');

    await expect(page.locator('#continueLink'))
      .toHaveAttribute('href', '../automation-lab/');

    await expect(
      page.locator('#stepList li').last().locator('a')
    ).toHaveAttribute(
      'href', '../automation-lab/capstone/'
    );
  });

  test('counts Module 1 only once', async ({ page }) => {
    await seed(page, [
      moduleSession(1),
      moduleSession(1, '1ccc')
    ]);

    await expect(page.locator('#detailsCount'))
      .toHaveText('1/7');

    await expect(page.locator('#stepList li.done'))
      .toHaveCount(1);

    await expect(page.locator('#continueTitle'))
      .toHaveText('Module 2 — Locators & Interactions');

    await expect(page.locator('#continueLink'))
      .toHaveAttribute(
        'href', '../automation-lab/module-2/'
      );
  });

  test('ignores incorrect or unrelated automation IDs', async ({ page }) => {
    await seed(page, [
      moduleSession(2),
      moduleSession(9),
      { ...moduleSession(3), id: 'automation-m3-invalid' },
      {
        ...capstone,
        id: 'automation-capstone-v1-invalid'
      },
      {
        ...moduleSession(1),
        area: 'manual'
      }
    ]);

    await expect(page.locator('#detailsCount'))
      .toHaveText('1/7');

    await expect(page.locator('#stepList li.done'))
      .toHaveCount(1);

    await expect(page.locator('#stepList li').nth(1))
      .toContainText('Session recorded');

    await expect(page.locator('#continueTitle'))
      .toHaveText('Module 1 — Playwright Fundamentals');
  });

  test('recognizes Capstone independently', async ({ page }) => {
    await seed(page, [capstone]);

    await expect(page.locator('#detailsCount'))
      .toHaveText('1/7');

    await expect(page.locator('#stepList li.done'))
      .toHaveCount(1);

    await expect(page.locator('#stepList li').last())
      .toContainText('Session recorded');

    await expect(page.locator('#continueTitle'))
      .toHaveText('Module 1 — Playwright Fundamentals');
  });

  test('recommends ShopFlow after all six modules', async ({ page }) => {
    await seed(page, [
      ...Array.from(
        { length: 6 },
        (_, index) => moduleSession(index + 1)
      )
    ]);

    await expect(page.locator('#detailsCount'))
      .toHaveText('6/7');

    await expect(page.locator('#continueTitle'))
      .toHaveText('ShopFlow Automation Capstone');

    await expect(page.locator('#continueLink'))
      .toHaveAttribute(
        'href', '../automation-lab/capstone/'
      );

    await expect(page.locator('#stepList li.done'))
      .toHaveCount(6);
  });

  test('recognizes all seven completed activities', async ({ page }) => {
    await seed(page, [
      capstone,
      ...Array.from(
        { length: 6 },
        (_, index) => moduleSession(index + 1)
      )
    ]);

    await expect(page.locator('#detailsCount'))
      .toHaveText('7/7');

    await expect(
      page.locator('[data-path-percent="automation"]')
    ).toHaveText('100%');

    await expect(page.locator('#stepList li.done'))
      .toHaveCount(7);

    await expect(page.locator('#continueTitle'))
      .toHaveText('All activities recorded');

    await expect(page.locator('#continueStatus'))
      .toContainText('100%');
  });

  test('preserves existing paths and progress data', async ({ page }) => {
    const sessions = [
      moduleSession(1),
      {
        id: 'manual-session-001',
        type: 'practice',
        area: 'manual',
        score: 80,
        maxScore: 100,
        completedAt: '2026-10-25T10:00:00.000Z',
        questionScores: [20, 20, 20, 20]
      }
    ];

    await seed(page, sessions);

    const original = await page.evaluate(
      key => localStorage.getItem(key), key
    );

    await page.locator('[data-path="beginner"]').click();

    await expect(page.locator('#detailsCount'))
      .toHaveText('1/3');

    await page.locator('[data-path="automation"]').click();

    await expect(page.locator('#detailsCount'))
      .toHaveText('1/7');

    await expect(page).toHaveURL(/path=automation/);

    const after = await page.evaluate(
      key => localStorage.getItem(key), key
    );

    expect(after).toBe(original);
  });

  test('supports keyboard access and mobile layout', async ({ page }) => {
    await page.setViewportSize({
      width: 390,
      height: 844
    });

    const button = page.locator('[data-path="automation"]');

    await button.focus();
    await expect(button).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page.locator('#detailsTitle'))
      .toHaveText('QA Test Automation');

    await expect(page.locator('#stepList li'))
      .toHaveCount(7);

    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth
    }));

    expect(dimensions.page)
      .toBeLessThanOrEqual(dimensions.viewport + 2);
  });

});
