import { test, expect, type Page } from '@playwright/test';

const STORAGE_KEY = 'practicalQaLab.progress.v1';

const stages = [
  { id: 'first', points: 20 },
  { id: 'second', points: 25 },
  { id: 'third', points: 25 },
  { id: 'fourth', points: 30 }
];

const correct = {
  first: 'correct',
  second: 'correct',
  third: 'correct',
  fourth: 'correct'
};

async function loadHelper(page: Page) {
  await page.goto('/automation-lab/');

  // Load the helper only inside this isolated test browser.
  await page.addScriptTag({
    url: '/automation-lab/progress-save.js'
  });
}

async function save(
  page: Page,
  moduleNumber: number,
  choices: Record<string, string>
) {
  return page.evaluate(
    ({ moduleNumber, stages, choices }) =>
      (window as any).AutomationLabProgress.save(
        moduleNumber, stages, choices
      ),
    { moduleNumber, stages, choices }
  );
}

test.describe('Automation Lab progress saving', () => {

  test('saves a completed assessment correctly', async ({ page }) => {
    await loadHelper(page);

    const result = await save(page, 1, correct);

    expect(result.status).toBe('saved');
    expect(result.score).toBe(100);
    expect(result.id).toBe('automation-m1-cccc');

    const sessions = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      STORAGE_KEY
    );

    expect(sessions).toHaveLength(1);

    expect(sessions[0]).toMatchObject({
      id: 'automation-m1-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      questionScores: [20, 25, 25, 30]
    });

    expect(Number.isFinite(
      Date.parse(sessions[0].completedAt)
    )).toBe(true);
  });

  test('prevents duplicate reviews but allows corrected answers', async ({ page }) => {
    await loadHelper(page);

    const incorrect = {
      ...correct,
      first: 'wrong1'
    };

    const first = await save(page, 2, incorrect);
    expect(first.status).toBe('saved');
    expect(first.score).toBe(80);

    const duplicate = await save(page, 2, incorrect);
    expect(duplicate.status).toBe('duplicate');

    const corrected = await save(page, 2, correct);
    expect(corrected.status).toBe('saved');
    expect(corrected.score).toBe(100);

    // Revisiting the previously saved 80/100 answer
    // must not create another identical session.
    const oldAttempt = await save(page, 2, incorrect);
    expect(oldAttempt.status).toBe('duplicate');

    const sessions = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      STORAGE_KEY
    );

    expect(sessions).toHaveLength(2);
    expect(sessions.map((item: any) => item.score))
      .toEqual([100, 80]);
  });

  test('preserves existing learner progress', async ({ page }) => {
    await loadHelper(page);

    const existing = {
      id: 'historic-manual-123',
      type: 'practice',
      area: 'manual',
      score: 68,
      maxScore: 100,
      completedAt: '2026-10-01T10:00:00.000Z',
      questionScores: [18, 20, 30]
    };

    await page.evaluate(({ key, existing }) => {
      localStorage.setItem(key, JSON.stringify([existing]));
    }, { key: STORAGE_KEY, existing });

    const result = await save(page, 3, correct);
    expect(result.status).toBe('saved');

    const sessions = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      STORAGE_KEY
    );

    expect(sessions).toHaveLength(2);
    expect(sessions[0].area).toBe('automation');
    expect(sessions[1]).toEqual(existing);
  });

  test('identifies modules separately and survives refresh', async ({ page }) => {
    await loadHelper(page);

    const first = await save(page, 1, correct);
    const sixth = await save(page, 6, correct);

    expect(first.status).toBe('saved');
    expect(sixth.status).toBe('saved');
    expect(first.id).not.toBe(sixth.id);

    await page.reload();

    await page.addScriptTag({
      url: '/automation-lab/progress-save.js'
    });

    const repeat = await save(page, 6, correct);
    expect(repeat.status).toBe('duplicate');

    const sessions = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      STORAGE_KEY
    );

    expect(sessions).toHaveLength(2);
    expect(sessions.every((s: any) =>
      s.area === 'automation'
    )).toBe(true);
  });

  test('rejects incomplete input and preserves damaged storage', async ({ page }) => {
    await loadHelper(page);

    const incomplete = {
      first: 'correct',
      second: 'correct',
      third: 'correct'
    };

    const rejected = await save(page, 1, incomplete);
    expect(rejected.status).toBe('invalid');

    expect(await page.evaluate(key =>
      localStorage.getItem(key), STORAGE_KEY
    )).toBeNull();

    // Invalid stored JSON must not be overwritten.
    await page.evaluate(key =>
      localStorage.setItem(key, '{invalid-json'),
      STORAGE_KEY
    );

    const unavailable = await save(page, 1, correct);
    expect(unavailable.status).toBe('unavailable');

    expect(await page.evaluate(key =>
      localStorage.getItem(key), STORAGE_KEY
    )).toBe('{invalid-json');
  });

});
