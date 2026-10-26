import { test, expect, type Page } from '@playwright/test';

const capstonePath = '/automation-lab/capstone/';
const progressKey = 'practicalQaLab.progress.v1';

const missions: Array<{
  max: number;
  answers: Array<[string, string]>;
}> = [
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

async function reviewAll(page: Page, restored = false) {
  for (const [index, mission] of missions.entries()) {
    const number = index + 1;

    if (!restored) {
      for (const [id, value] of mission.answers) {
        await page.locator('#' + id).selectOption(value);
      }
    }

    await page.locator(`#capstoneM${number}Review`).click();

    await expect(
      page.locator(`#capstoneM${number}Score`)
    ).toHaveText(`${mission.max}/${mission.max}`);
  }
}

async function finishReport(page: Page, score = 100) {
  await page.locator('#capstoneSummaryReview').click();

  await expect(page.locator('#capstoneSummaryScore'))
    .toHaveText(`${score}/100`);

  await page.locator('#capstoneReportGenerate').click();

  await expect(page.locator('#capstoneReportResult'))
    .toBeVisible();

  await expect(page.locator('#capstoneReportScore'))
    .toHaveText(`${score}/100`);
}

async function completeAssessment(page: Page) {
  await reviewAll(page);
  await finishReport(page);
}

async function saveFromUI(page: Page) {
  await page.locator('#capstoneProgressSave').click();
}

async function readHistory(page: Page) {
  return page.evaluate(key =>
    JSON.parse(localStorage.getItem(key) || '[]'),
    progressKey
  );
}

test.describe('v1.5 Capstone - My Progress UI', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);
  });

  test('shows Save only after the report is generated', async ({ page }) => {
    await expect(page.locator('#capstoneProgressSave'))
      .toBeHidden();

    await reviewAll(page);

    await expect(page.locator('#capstoneProgressSave'))
      .toBeHidden();

    await page.locator('#capstoneSummaryReview').click();

    await expect(page.locator('#capstoneProgressSave'))
      .toBeHidden();

    await page.locator('#capstoneReportGenerate').click();

    await expect(page.locator('#capstoneProgressSave'))
      .toBeVisible();

    await expect(page.locator('#capstoneProgressStatus'))
      .toContainText('you can save this assessment to My Progress');

    expect(await readHistory(page)).toEqual([]);
  });

  test('saves a completed attempt and prevents duplicates', async ({ page }) => {
    const existing = {
      id: 'existing-learner-session',
      type: 'practice',
      area: 'manual',
      score: 80,
      maxScore: 100,
      completedAt: '2026-10-20T10:00:00.000Z',
      questionScores: [20, 20, 20, 20]
    };

    await page.evaluate(({ key, session }) => {
      localStorage.setItem(key, JSON.stringify([session]));
    }, {
      key: progressKey,
      session: existing
    });

    await completeAssessment(page);
    await saveFromUI(page);

    await expect(page.locator('#capstoneProgressStatus'))
      .toContainText('Saved successfully');

    const first = await readHistory(page);

    expect(first).toHaveLength(2);
    expect(first[1]).toEqual(existing);

    expect(first[0]).toMatchObject({
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      questionScores: [15, 20, 20, 15, 15, 15]
    });

    expect(first[0].id).toMatch(
      /^automation-capstone-v1-[123]{20}$/
    );

    await saveFromUI(page);

    await expect(page.locator('#capstoneProgressStatus'))
      .toContainText('No duplicate was created');

    expect(await readHistory(page)).toEqual(first);
  });

  test('saves a corrected attempt without replacing the first', async ({ page }) => {
    await completeAssessment(page);
    await saveFromUI(page);

    const first = await readHistory(page);

    expect(first).toHaveLength(1);
    expect(first[0].score).toBe(100);

    // Change one answer worth five points.
    await page.locator('#capstoneM6Request')
      .selectOption('post');

    await expect(page.locator('#capstoneReportResult'))
      .toBeHidden();

    await expect(page.locator('#capstoneProgressSave'))
      .toBeHidden();

    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('10/15');

    await finishReport(page, 95);
    await saveFromUI(page);

    await expect(page.locator('#capstoneProgressStatus'))
      .toContainText('Saved successfully');

    const history = await readHistory(page);

    expect(history).toHaveLength(2);
    expect(history[0].score).toBe(95);
    expect(history[1].score).toBe(100);

    expect(history[0].questionScores)
      .toEqual([15, 20, 20, 15, 15, 10]);

    expect(history[0].id).not.toBe(history[1].id);

    await saveFromUI(page);

    expect(await readHistory(page)).toEqual(history);
  });

  test('preserves saved attempts across refresh', async ({ page }) => {
    await completeAssessment(page);
    await saveFromUI(page);

    const before = await readHistory(page);

    await page.reload();

    await expect(page.locator('#capstoneProgressSave'))
      .toBeHidden();

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');

    await expect(page.locator('#capstoneM6Request'))
      .toHaveValue('get');

    expect(await readHistory(page)).toEqual(before);

    // Restored drafts require a fresh review.
    await reviewAll(page, true);
    await finishReport(page);
    await saveFromUI(page);

    await expect(page.locator('#capstoneProgressStatus'))
      .toContainText('No duplicate was created');

    expect(await readHistory(page)).toEqual(before);
  });

  test('does not overwrite damaged progress history', async ({ page }) => {
    await completeAssessment(page);

    const invalidHistories = [
      '{invalid-json',
      JSON.stringify({ sessions: [] }),
      JSON.stringify([{ score: 100 }])
    ];

    for (const raw of invalidHistories) {
      await page.evaluate(({ key, value }) => {
        localStorage.setItem(key, value);
      }, {
        key: progressKey,
        value: raw
      });

      await saveFromUI(page);

      await expect(page.locator('#capstoneProgressStatus'))
        .toContainText('Unable to save safely');

      const after = await page.evaluate(key =>
        localStorage.getItem(key),
        progressKey
      );

      expect(after).toBe(raw);
    }
  });

  test('respects the 250-session history limit through the UI', async ({ page }) => {
    const existing = Array.from(
      { length: 250 },
      (_, index) => ({
        id: `existing-session-${index}`,
        type: 'practice',
        area: 'manual',
        score: 80,
        maxScore: 100,
        completedAt: '2026-10-20T10:00:00.000Z',
        questionScores: [20, 20, 20, 20]
      })
    );

    await page.evaluate(({ key, sessions }) => {
      localStorage.setItem(key, JSON.stringify(sessions));
    }, {
      key: progressKey,
      sessions: existing
    });

    await completeAssessment(page);
    await saveFromUI(page);

    const history = await readHistory(page);

    expect(history).toHaveLength(250);

    expect(history[0].id).toMatch(
      /^automation-capstone-v1-[123]{20}$/
    );

    expect(history[1].id).toBe('existing-session-0');
    expect(history[249].id).toBe('existing-session-248');

    expect(
      history.some((item: { id: string }) =>
        item.id === 'existing-session-249'
      )
    ).toBe(false);

    await saveFromUI(page);

    expect(await readHistory(page)).toEqual(history);
  });

});
