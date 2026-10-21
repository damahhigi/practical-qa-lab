import { test, expect } from '@playwright/test';

test.describe('v1.3 Learning Paths', () => {

  test('preserves the selected path and shows six Intermediate activities', async ({ page }) => {
    await page.goto('/learning-paths/?path=intermediate');

    await expect(page.locator('[data-path="intermediate"]'))
      .toHaveAttribute('aria-pressed', 'true');

    await expect(page.locator('#detailsCount')).toHaveText('0/6');

    await expect(page.locator('#stepList li')).toHaveCount(6);

    await expect(page.locator('#stepList li').last())
      .toContainText('Release Readiness Challenge');

    await page.reload();

    await expect(page.locator('[data-path="intermediate"]'))
      .toHaveAttribute('aria-pressed', 'true');

    await page.locator('[data-path="interview"]').click();

    await expect(page).toHaveURL(/path=interview/);

    await expect(page.locator('#detailsTitle'))
      .toHaveText('QA Interview Prep');
  });

  test('recommends the earliest unfinished activity', async ({ page }) => {
    await page.goto('/learning-paths/?path=intermediate');

    // Test-only progress in an isolated Playwright browser context.
    const completed = [
      ['practice', 'api'],
      ['challenge', 'sqlvalidation'],
      ['challenge', 'apibughunt'],
      ['challenge', 'bugtriage']
    ];

    await page.evaluate((items) => {
      const sessions = items.map(([type, area], index) => ({
        id: `test-${index}`,
        type,
        area,
        score: 100,
        maxScore: 100,
        completedAt: new Date().toISOString(),
        questionScores: []
      }));

      localStorage.setItem(
        'practicalQaLab.progress.v1',
        JSON.stringify(sessions)
      );
    }, completed);

    await page.reload();

    await expect(page.locator('#detailsCount')).toHaveText('4/6');

    await expect(page.locator('#continueTitle'))
      .toHaveText('Checkout Bug Hunt');

    await expect(page.locator('#continueStatus'))
      .toContainText('Step 3 of 6');

    await expect(page.locator('#continueStatus'))
      .toContainText('67%');

    await expect(page.locator('#continueLink'))
      .toHaveAttribute('href', '../checkout-bug-hunt/');
  });


  test('recognizes a fully completed Intermediate QA path', async ({ page }) => {
    await page.goto('/learning-paths/?path=intermediate');

    const originalHistory = await page.evaluate(() => {
      const activities = [
        ['practice', 'api'],
        ['challenge', 'sqlvalidation'],
        ['challenge', 'checkout'],
        ['challenge', 'apibughunt'],
        ['challenge', 'bugtriage'],
        ['challenge', 'releasereadiness']
      ];

      const sessions = activities.map(([type, area], index) => ({
        id: `completed-${index}`,
        type,
        area,
        score: 100,
        maxScore: 100,
        completedAt: '2026-10-21T09:00:00.000Z',
        questionScores: []
      }));

      const saved = JSON.stringify(sessions);

      localStorage.setItem(
        'practicalQaLab.progress.v1',
        saved
      );

      return saved;
    });

    await page.reload();

    await expect(page.locator('#detailsCount')).toHaveText('6/6');

    await expect(page.locator('[data-path-count="intermediate"]'))
      .toHaveText('6 of 6 activities');

    await expect(page.locator('#continueTitle'))
      .toHaveText('All activities recorded');

    await expect(page.locator('#continueStatus'))
      .toContainText('100%');

    await expect(page.locator('#stepList li.done'))
      .toHaveCount(6);

    await expect(page.locator('#continueLink'))
      .toContainText('Practise API Testing Questions again');

    // Learning Paths must never modify existing history.
    const finalHistory = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(finalHistory).toBe(originalHistory);
  });

});
