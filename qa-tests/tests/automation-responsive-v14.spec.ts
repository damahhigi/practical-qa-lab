import { test, expect } from '@playwright/test';

const widths = [320, 360, 430, 768, 1280];

const routes = [
  '/',
  '/automation-lab/learning-path/',
  '/automation-lab/',
  '/automation-lab/module-2/',
  '/automation-lab/module-3/',
  '/automation-lab/module-4/',
  '/automation-lab/module-5/',
  '/automation-lab/module-6/'
];

async function checkOverflow(page: any, label: string) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth
  }));

  expect(
    Math.max(dimensions.document, dimensions.body),
    `${label}: horizontal overflow detected: ${JSON.stringify(dimensions)}`
  ).toBeLessThanOrEqual(dimensions.viewport + 1);
}

for (const width of widths) {
  test(`v1.4 layout fits ${width}px screens`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: 850
    });

    // Verify the homepage, learning path, and all six modules.
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('body')).toBeVisible();
      await checkOverflow(page, route);
    }

    // Populate My Progress inside Playwright's isolated browser.
    const pointBreakdowns = [
      [20, 20, 25, 35],
      [20, 25, 30, 25],
      [20, 25, 25, 30],
      [20, 25, 25, 30],
      [20, 25, 25, 30],
      [20, 25, 25, 30]
    ];

    const sessions = pointBreakdowns.map((points, index) => ({
      id: `automation-m${index + 1}-cccc`,
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      completedAt: new Date(
        Date.UTC(2026, 9, 22, 12 - index)
      ).toISOString(),
      questionScores: points
    }));

    await page.goto('/');

    await page.evaluate(data => {
      localStorage.setItem(
        'practicalQaLab.progress.v1',
        JSON.stringify(data)
      );
    }, sessions);

    await page.reload();

    await page.getByRole('button', {
      name: 'My Progress',
      exact: true
    }).click();

    await expect(
      page.locator('#progressHistory .progress-history-title')
    ).toHaveCount(6);

    await checkOverflow(page, 'My Progress dashboard');
  });
}
