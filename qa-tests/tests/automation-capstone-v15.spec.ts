import { test, expect } from '@playwright/test';

const capstonePath = '/automation-lab/capstone/';

test.describe('v1.5 ShopFlow Automation Capstone', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);
  });

  test('displays the project briefing and product details', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'ShopFlow Release Check' })
    ).toBeVisible();

    await expect(page.locator('.capstone-summary-grid .capstone-card'))
      .toHaveCount(3);

    await expect(page.locator('.capstone-summary-grid'))
      .toContainText('Canvas Backpack');

    await expect(page.locator('.capstone-summary-grid'))
      .toContainText('42');

    await expect(page.locator('.capstone-summary-grid'))
      .toContainText('KES 2,400');

    await expect(page.locator('.capstone-summary-grid'))
      .toContainText('5 units');
  });

  test('displays all seven acceptance criteria', async ({ page }) => {
    await expect(
      page.locator('.criteria-list .criterion-card')
    ).toHaveCount(7);

    await expect(
      page.locator('.criterion-id')
    ).toHaveText([
      'AC-01',
      'AC-02',
      'AC-03',
      'AC-04',
      'AC-05',
      'AC-06',
      'AC-07'
    ]);

    await expect(
      page.locator('.criterion-card h3')
    ).toHaveText([
      'Display the correct product',
      'Calculate the cart total',
      'Enforce stock boundaries',
      'Validate checkout email',
      'Validate product API response',
      'Handle a missing product',
      'Ensure reliable automation'
    ]);
  });

  test('displays six missions with 100 total points', async ({ page }) => {
    await expect(
      page.locator('.mission-list .mission-card')
    ).toHaveCount(6);

    await expect(
      page.locator('.mission-card h3')
    ).toHaveText([
      'Test Strategy & Smoke Coverage',
      'UI Locators & Interactions',
      'Assertions & State Validation',
      'Negative & Boundary Testing',
      'Debugging Flaky Tests',
      'API Contract Validation'
    ]);

    await expect(
      page.locator('.mission-points')
    ).toHaveText([
      '15 points',
      '20 points',
      '20 points',
      '15 points',
      '15 points',
      '15 points'
    ]);

    const total = await page.locator('.mission-points')
      .allTextContents();

    const points = total.reduce(
      (sum, text) => sum + Number.parseInt(text, 10),
      0
    );

    expect(points).toBe(100);

    await expect(
      page.locator('.mission-status')
    ).toHaveCount(6);
  });

  test('explains simulation limits and links back to learning path', async ({ page }) => {
    const disclaimer = page.locator('.capstone-disclaimer');

    await expect(disclaimer)
      .toContainText('It will not execute Playwright');

    await expect(disclaimer)
      .toContainText('Review all six guided missions');

    await expect(disclaimer)
      .toContainText('download a practice report');

    await expect(disclaimer)
      .toContainText('My Progress');

    await expect(disclaimer)
      .not.toContainText('Mission 1 offers a local guided review');

    // All six missions are interactive.
    for (let number = 1; number <= 6; number++) {
      await expect(
        page.locator(`#capstoneM${number}Form`)
      ).toHaveCount(1);
    }
    await expect(page.locator('form')).toHaveCount(6);

    await page.getByRole('link', {
      name: /Learning path/
    }).click();

    await expect(page).toHaveURL(
      /\/automation-lab\/learning-path\/$/
    );

    await expect(
      page.getByRole('heading', {
        name: 'Build reliable tests, one skill at a time.'
      })
    ).toBeVisible();
  });

  test('remains responsive across mobile and desktop widths', async ({ page }) => {
    for (const width of [320, 360, 430, 768, 1280]) {
      await page.setViewportSize({
        width,
        height: 850
      });

      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }));

      expect(
        Math.max(dimensions.document, dimensions.body),
        `Horizontal overflow at ${width}px: ${JSON.stringify(dimensions)}`
      ).toBeLessThanOrEqual(dimensions.viewport + 1);

      await expect(
        page.getByRole('heading', {
          name: 'ShopFlow Release Check'
        })
      ).toBeVisible();
    }
  });

});
