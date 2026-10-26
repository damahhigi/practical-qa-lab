import { test, expect, type Page } from '@playwright/test';

const capstonePath = '/automation-lab/capstone/';
const progressKey = 'practicalQaLab.progress.v1';

const missions = [
  {
    max: 15,
    answers: [
      ['capstoneM1Smoke', 'journey'],
      ['capstoneM1Email', 'invalid-email'],
      ['capstoneM1Release', 'block-and-retest']
    ]
  },
  {
    max: 20,
    answers: [
      ['capstoneM2Product', 'role'],
      ['capstoneM2Cart', 'role'],
      ['capstoneM2Quantity', 'label'],
      ['capstoneM2Subtotal', 'subtotal']
    ]
  },
  {
    max: 20,
    answers: [
      ['capstoneM3Heading', 'heading'],
      ['capstoneM3Price', 'price'],
      ['capstoneM3Quantity', 'value'],
      ['capstoneM3Subtotal', 'subtotal']
    ]
  },
  {
    max: 15,
    answers: [
      ['capstoneM4Boundaries', 'edges'],
      ['capstoneM4CartState', 'unchanged'],
      ['capstoneM4Email', 'both']
    ]
  },
  {
    max: 15,
    answers: [
      ['capstoneM5Waiting', 'retry-assertion'],
      ['capstoneM5Locator', 'scoped-role'],
      ['capstoneM5Isolation', 'isolated-state']
    ]
  },
  {
    max: 15,
    answers: [
      ['capstoneM6Request', 'get'],
      ['capstoneM6Contract', 'contract'],
      ['capstoneM6Missing', 'not-found']
    ]
  }
];

async function loadHelper(page: Page) {
  await page.addScriptTag({
    url: '/automation-lab/capstone/progress-save.js'
  });

  const available = await page.evaluate(() => {
    const target = window as typeof window & {
      ShopFlowCapstoneProgress?: {
        save: () => { status: string }
      }
    };

    return typeof target.ShopFlowCapstoneProgress?.save;
  });

  expect(available).toBe('function');
}

async function saveProgress(page: Page) {
  return page.evaluate(() => {
    const target = window as typeof window & {
      ShopFlowCapstoneProgress?: {
        save: () => {
          status: string;
          id?: string;
          score?: number;
        }
      }
    };

    return target.ShopFlowCapstoneProgress?.save()
      ?? { status: 'not-loaded' };
  });
}

async function reviewAll(page: Page, restore = false) {
  for (const [index, mission] of missions.entries()) {
    if (!restore) {
      for (const [id, value] of mission.answers) {
        await page.locator('#' + id).selectOption(value);
      }
    }

    const number = index + 1;

    await page.locator(`#capstoneM${number}Review`).click();

    await expect(
      page.locator(`#capstoneM${number}Score`)
    ).toHaveText(`${mission.max}/${mission.max}`);
  }

  await page.locator('#capstoneSummaryReview').click();

  await expect(page.locator('#capstoneSummaryScore'))
    .toHaveText('100/100');

  await page.locator('#capstoneReportGenerate').click();

  await expect(page.locator('#capstoneReportScore'))
    .toHaveText('100/100');

  await expect(page.locator('#capstoneReportResult'))
    .toBeVisible();
}

test.describe('v1.5 Capstone - My Progress Helper', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);

    // Inject only into this isolated Playwright page.
    // The website does not load this helper yet.
    await loadHelper(page);
  });

  test('rejects incomplete assessments without saving', async ({ page }) => {
    expect((await saveProgress(page)).status).toBe('invalid');

    await page.locator('#capstoneM1Smoke')
      .selectOption('journey');

    await page.locator('#capstoneM1Email')
      .selectOption('invalid-email');

    await page.locator('#capstoneM1Release')
      .selectOption('block-and-retest');

    await page.locator('#capstoneM1Review').click();

    expect((await saveProgress(page)).status).toBe('invalid');

    const history = await page.evaluate(key =>
      localStorage.getItem(key),
      progressKey
    );

    expect(history).toBeNull();
  });

  test('saves 100/100 and preserves existing progress', async ({ page }) => {
    const legacySession = {
      id: 'automation-m6-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      completedAt: '2026-10-20T10:00:00.000Z',
      questionScores: [20, 25, 25, 30]
    };

    await page.evaluate(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify([session]));
    }, {
      key: progressKey,
      session: legacySession
    });

    await reviewAll(page);

    const saved = await saveProgress(page);

    expect(saved.status).toBe('saved');
    expect(saved.score).toBe(100);
    expect(saved.id).toMatch(
      /^automation-capstone-v1-[123]{20}$/
    );

    const history = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      progressKey
    );

    expect(history).toHaveLength(2);
    expect(history[1]).toEqual(legacySession);

    expect(history[0]).toMatchObject({
      id: saved.id,
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      questionScores: [15, 20, 20, 15, 15, 15]
    });

    expect(
      Number.isNaN(Date.parse(history[0].completedAt))
    ).toBe(false);
  });

  test('prevents duplicates and saves corrected attempts', async ({ page }) => {
    await reviewAll(page);

    const first = await saveProgress(page);
    expect(first.status).toBe('saved');

    const repeated = await saveProgress(page);
    expect(repeated.status).toBe('duplicate');
    expect(repeated.id).toBe(first.id);

    // Duplicate detection must also survive a page reload.
    await page.reload();
    await loadHelper(page);

    await reviewAll(page, true);

    const restored = await saveProgress(page);
    expect(restored.status).toBe('duplicate');
    expect(restored.id).toBe(first.id);

    // Change one answer and review the updated assessment.
    await page.locator('#capstoneM6Request')
      .selectOption('post');

    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('10/15');

    await page.locator('#capstoneSummaryReview').click();

    await expect(page.locator('#capstoneSummaryScore'))
      .toHaveText('95/100');

    await page.locator('#capstoneReportGenerate').click();

    await expect(page.locator('#capstoneReportScore'))
      .toHaveText('95/100');

    const corrected = await saveProgress(page);

    expect(corrected.status).toBe('saved');
    expect(corrected.score).toBe(95);
    expect(corrected.id).not.toBe(first.id);

    const history = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      progressKey
    );

    expect(history).toHaveLength(2);
    expect(history[0].score).toBe(95);
    expect(history[1].score).toBe(100);
  });

  test('rejects stale or reset assessments', async ({ page }) => {
    await reviewAll(page);

    // Changing an answer invalidates the earlier report.
    await page.locator('#capstoneM4Boundaries')
      .selectOption('happy-only');

    expect((await saveProgress(page)).status).toBe('invalid');

    await page.locator('#capstoneM4Review').click();
    await page.locator('#capstoneSummaryReview').click();

    // Recalculation alone is insufficient.
    // The report must also be regenerated.
    expect((await saveProgress(page)).status).toBe('invalid');

    await page.locator('#capstoneReportGenerate').click();

    const corrected = await saveProgress(page);
    expect(corrected.status).toBe('saved');
    expect(corrected.score).toBe(95);

    await page.locator('#capstoneM4Reset').click();

    expect((await saveProgress(page)).status).toBe('invalid');

    const history = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      progressKey
    );

    // Resetting a draft must not erase a saved attempt.
    expect(history).toHaveLength(1);
    expect(history[0].score).toBe(95);
  });

  test('does not overwrite damaged existing progress', async ({ page }) => {
    await reviewAll(page);

    const invalidHistories = [
      '{invalid-json',
      JSON.stringify({ sessions: [] }),
      JSON.stringify([{ score: 100 }])
    ];

    for (const damaged of invalidHistories) {
      await page.evaluate(({ key, raw }) => {
        localStorage.setItem(key, raw);
      }, {
        key: progressKey,
        raw: damaged
      });

      const result = await saveProgress(page);

      expect(result.status).toBe('unavailable');

      const after = await page.evaluate(key =>
        localStorage.getItem(key),
        progressKey
      );

      expect(after).toBe(damaged);
    }
  });

  test('respects the 250-session history limit', async ({ page }) => {
    const existing = Array.from(
      { length: 250 },
      (_, index) => ({
        id: `existing-session-${index}`,
        type: 'practice',
        area: 'automation',
        score: 80,
        maxScore: 100,
        completedAt: '2026-10-20T10:00:00.000Z',
        questionScores: [15, 15, 20, 15, 15]
      })
    );

    await page.evaluate(({ key, sessions }) => {
      localStorage.setItem(key, JSON.stringify(sessions));
    }, {
      key: progressKey,
      sessions: existing
    });

    await reviewAll(page);

    const saved = await saveProgress(page);
    expect(saved.status).toBe('saved');

    const history = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      progressKey
    );

    expect(history).toHaveLength(250);

    expect(history[0].id).toBe(saved.id);

    expect(history[1].id)
      .toBe('existing-session-0');

    expect(history[249].id)
      .toBe('existing-session-248');

    expect(
      history.some(
        (session: { id: string }) =>
          session.id === 'existing-session-249'
      )
    ).toBe(false);
  });

});
