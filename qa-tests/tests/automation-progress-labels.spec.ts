import { test, expect } from '@playwright/test';

const storageKey = 'practicalQaLab.progress.v1';

const moduleNames = [
  'Playwright Fundamentals',
  'Locators & Interactions',
  'Assertions & Validation',
  'Negative & Boundary Testing',
  'Debugging Flaky Tests',
  'API Automation'
];

function createSession(
  id: string,
  area = 'automation',
  score = 100
) {
  return {
    id,
    type: 'practice',
    area,
    score,
    maxScore: 100,
    completedAt: '2026-10-22T10:00:00.000Z',
    questionScores: [score]
  };
}

test.describe('Automation Lab history labels', () => {

  test('displays all six module names and preserves other areas', async ({ page }) => {
    const sessions = moduleNames.map((_, index) =>
      createSession(`automation-m${index + 1}-cccc`)
    );

    sessions.push(createSession('manual-history-123', 'manual', 75));

    await page.goto('/');

    // Set up sample data in the isolated Playwright browser.
    await page.evaluate(({ key, sessions }) => {
      localStorage.setItem(key, JSON.stringify(sessions));
    }, { key: storageKey, sessions });

    await page.reload();

    await page.getByRole('button', {
      name: 'My Progress',
      exact: true
    }).click();

    const titles = page.locator(
      '#progressHistory .progress-history-title'
    );

    await expect(titles).toHaveText([
      'Module 1 — Playwright Fundamentals',
      'Module 2 — Locators & Interactions',
      'Module 3 — Assertions & Validation',
      'Module 4 — Negative & Boundary Testing',
      'Module 5 — Debugging Flaky Tests',
      'Module 6 — API Automation',
      'Manual QA'
    ]);

    await expect(
      page.locator('#progressHistory .progress-history-score')
    ).toHaveText([
      '100/100 · 100%',
      '100/100 · 100%',
      '100/100 · 100%',
      '100/100 · 100%',
      '100/100 · 100%',
      '100/100 · 100%',
      '75/100 · 75%'
    ]);

    // Rendering the dashboard must not change saved sessions.
    const stored = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      storageKey
    );

    expect(stored).toEqual(sessions);
  });

  test('uses the general label for unknown module IDs', async ({ page }) => {
    const sessions = [
      createSession('automation-m7-cccc'),
      createSession('legacy-automation-123'),
      createSession('automation-m1-cccc')
    ];

    await page.goto('/');

    await page.evaluate(({ key, sessions }) => {
      localStorage.setItem(key, JSON.stringify(sessions));
    }, { key: storageKey, sessions });

    await page.reload();

    await page.getByRole('button', {
      name: 'My Progress',
      exact: true
    }).click();

    const titles = page.locator(
      '#progressHistory .progress-history-title'
    );

    await expect(titles).toHaveText([
      'Test Automation Lab',
      'Test Automation Lab',
      'Module 1 — Playwright Fundamentals'
    ]);

    const stored = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      storageKey
    );

    expect(stored).toEqual(sessions);
  });

});
