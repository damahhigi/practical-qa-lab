import { test, expect } from '@playwright/test';

test.describe('v1.3 Progress Insights', () => {

  test('explains when repeat attempts are unavailable', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', {
      name: /View my progress/
    }).first().click();

    await expect(page.locator('#progressTrendSummary'))
      .toContainText('at least twice');

    await expect(page.locator('#progressAreas'))
      .toHaveText('0/12');
  });

  test('reports improvement between two API Testing attempts', async ({ page }) => {
    await page.goto('/');

    const originalHistory = await page.evaluate(() => {
      const sessions = [
        {
          id: 'api-latest',
          type: 'practice',
          area: 'api',
          score: 40,
          maxScore: 50,
          completedAt: '2026-10-21T10:00:00.000Z',
          questionScores: []
        },
        {
          id: 'api-previous',
          type: 'practice',
          area: 'api',
          score: 30,
          maxScore: 50,
          completedAt: '2026-10-20T10:00:00.000Z',
          questionScores: []
        }
      ];

      const saved = JSON.stringify(sessions);

      localStorage.setItem(
        'practicalQaLab.progress.v1',
        saved
      );

      return saved;
    });

    await page.reload();

    await page.getByRole('button', {
      name: /View my progress/
    }).first().click();

    const insight = page.locator('#progressTrendSummary');

    await expect(insight).toContainText('API Testing');
    await expect(insight).toContainText('60% → 80%');
    await expect(insight).toContainText(
      'up 20 percentage points'
    );

    // Progress Insights must not modify saved history.
    const finalHistory = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(finalHistory).toBe(originalHistory);
  });


  test('reports a declining score', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const sessions = [
        {
          id: 'sql-latest',
          type: 'practice',
          area: 'sql',
          score: 35,
          maxScore: 50,
          completedAt: '2026-10-21T10:00:00.000Z',
          questionScores: []
        },
        {
          id: 'sql-previous',
          type: 'practice',
          area: 'sql',
          score: 45,
          maxScore: 50,
          completedAt: '2026-10-20T10:00:00.000Z',
          questionScores: []
        }
      ];

      localStorage.setItem(
        'practicalQaLab.progress.v1',
        JSON.stringify(sessions)
      );
    });

    await page.reload();

    await page.getByRole('button', {
      name: /View my progress/
    }).first().click();

    const insight = page.locator('#progressTrendSummary');

    await expect(insight).toContainText('SQL Testing');
    await expect(insight).toContainText('90% → 70%');
    await expect(insight).toContainText(
      'down 20 percentage points'
    );
  });

  test('reports an unchanged score', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const sessions = [
        {
          id: 'manual-latest',
          type: 'practice',
          area: 'manual',
          score: 40,
          maxScore: 50,
          completedAt: '2026-10-21T10:00:00.000Z',
          questionScores: []
        },
        {
          id: 'manual-previous',
          type: 'practice',
          area: 'manual',
          score: 40,
          maxScore: 50,
          completedAt: '2026-10-20T10:00:00.000Z',
          questionScores: []
        }
      ];

      localStorage.setItem(
        'practicalQaLab.progress.v1',
        JSON.stringify(sessions)
      );
    });

    await page.reload();

    await page.getByRole('button', {
      name: /View my progress/
    }).first().click();

    const insight = page.locator('#progressTrendSummary');

    await expect(insight).toContainText('Manual QA');
    await expect(insight).toContainText('80% → 80%');
    await expect(insight).toContainText('no change');
  });


  test('selects the most recent comparable practice area', async ({ page }) => {
    await page.goto('/');

    const originalHistory = await page.evaluate(() => {
      const sessions = [
        {
          id: 'manual-single',
          type: 'practice',
          area: 'manual',
          score: 50,
          maxScore: 50,
          completedAt: '2026-10-21T10:00:00.000Z',
          questionScores: []
        },
        {
          id: 'sql-latest',
          type: 'practice',
          area: 'sql',
          score: 35,
          maxScore: 50,
          completedAt: '2026-10-20T10:00:00.000Z',
          questionScores: []
        },
        {
          id: 'sql-previous',
          type: 'practice',
          area: 'sql',
          score: 45,
          maxScore: 50,
          completedAt: '2026-10-19T10:00:00.000Z',
          questionScores: []
        },
        {
          id: 'api-latest',
          type: 'practice',
          area: 'api',
          score: 40,
          maxScore: 50,
          completedAt: '2026-10-14T10:00:00.000Z',
          questionScores: []
        },
        {
          id: 'api-previous',
          type: 'practice',
          area: 'api',
          score: 30,
          maxScore: 50,
          completedAt: '2026-10-10T10:00:00.000Z',
          questionScores: []
        }
      ];

      const saved = JSON.stringify(sessions);

      localStorage.setItem(
        'practicalQaLab.progress.v1',
        saved
      );

      return saved;
    });

    await page.reload();

    await page.getByRole('button', {
      name: /View my progress/
    }).first().click();

    const insight = page.locator('#progressTrendSummary');

    await expect(insight).toContainText('SQL Testing');
    await expect(insight).toContainText('90% → 70%');
    await expect(insight).toContainText(
      'down 20 percentage points'
    );

    await expect(insight).not.toContainText('API Testing');
    await expect(insight).not.toContainText('Manual QA');

    // The comparison must never change saved history.
    const finalHistory = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(finalHistory).toBe(originalHistory);
  });

});
