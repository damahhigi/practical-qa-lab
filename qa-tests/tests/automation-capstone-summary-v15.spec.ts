import { test, expect, type Page } from '@playwright/test';

const capstonePath = '/automation-lab/capstone/';
const progressKey = 'practicalQaLab.progress.v1';

const missions = [
  {
    number: 1,
    max: 15,
    answers: [
      ['capstoneM1Smoke', 'journey'],
      ['capstoneM1Email', 'invalid-email'],
      ['capstoneM1Release', 'block-and-retest']
    ]
  },
  {
    number: 2,
    max: 20,
    answers: [
      ['capstoneM2Product', 'role'],
      ['capstoneM2Cart', 'role'],
      ['capstoneM2Quantity', 'label'],
      ['capstoneM2Subtotal', 'subtotal']
    ]
  },
  {
    number: 3,
    max: 20,
    answers: [
      ['capstoneM3Heading', 'heading'],
      ['capstoneM3Price', 'price'],
      ['capstoneM3Quantity', 'value'],
      ['capstoneM3Subtotal', 'subtotal']
    ]
  },
  {
    number: 4,
    max: 15,
    answers: [
      ['capstoneM4Boundaries', 'edges'],
      ['capstoneM4CartState', 'unchanged'],
      ['capstoneM4Email', 'both']
    ]
  },
  {
    number: 5,
    max: 15,
    answers: [
      ['capstoneM5Waiting', 'retry-assertion'],
      ['capstoneM5Locator', 'scoped-role'],
      ['capstoneM5Isolation', 'isolated-state']
    ]
  },
  {
    number: 6,
    max: 15,
    answers: [
      ['capstoneM6Request', 'get'],
      ['capstoneM6Contract', 'contract'],
      ['capstoneM6Missing', 'not-found']
    ]
  }
];

async function reviewMission(
  page: Page,
  mission: typeof missions[number]
) {
  for (const [id, value] of mission.answers) {
    await page.locator('#' + id).selectOption(value);
  }

  await page.locator(
    `#capstoneM${mission.number}Review`
  ).click();

  await expect(
    page.locator(`#capstoneM${mission.number}Result`)
  ).toBeVisible();

  await expect(
    page.locator(`#capstoneM${mission.number}Score`)
  ).toHaveText(`${mission.max}/${mission.max}`);
}

async function reviewAll(page: Page) {
  for (const mission of missions) {
    await reviewMission(page, mission);
  }
}

async function calculate(page: Page) {
  await page.locator('#capstoneSummaryReview').click();
}

test.describe('v1.5 Capstone - Combined Score', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);
  });

  test('requires every mission to be reviewed', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Final Assessment Summary'
      })
    ).toBeVisible();

    await calculate(page);

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();

    await expect(page.locator('#capstoneSummaryStatus'))
      .toContainText('Mission 1');

    await expect(page.locator('#capstoneSummaryStatus'))
      .toContainText('Mission 6');

    // After Mission 1, only Missions 2–6 remain pending.
    await reviewMission(page, missions[0]);

    await calculate(page);

    await expect(page.locator('#capstoneSummaryStatus'))
      .toContainText('Mission 2');

    await expect(page.locator('#capstoneSummaryStatus'))
      .not.toContainText('Mission 1');

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();
  });

  test('calculates 100/100 with six mission scores', async ({ page }) => {
    await reviewAll(page);

    await calculate(page);

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeVisible();

    await expect(page.locator('#capstoneSummaryScore'))
      .toHaveText('100/100');

    const breakdown = page.locator(
      '#capstoneSummaryBreakdown li'
    );

    await expect(breakdown).toHaveCount(6);

    for (const [index, mission] of missions.entries()) {
      await expect(breakdown.nth(index))
        .toContainText(`Mission ${mission.number}`);

      await expect(breakdown.nth(index).locator('strong'))
        .toHaveText(`${mission.max}/${mission.max}`);
    }

    await expect(page.locator('#capstoneSummaryStatus'))
      .toContainText('All six missions reviewed');

    // Recalculating must not duplicate breakdown entries.
    await calculate(page);

    await expect(breakdown).toHaveCount(6);
    await expect(page.locator('#capstoneSummaryScore'))
      .toHaveText('100/100');
  });

  test('calculates 95/100 when one decision is incorrect', async ({ page }) => {
    await reviewAll(page);

    // Introduce one incorrect 5-point decision in Mission 6.
    await page.locator('#capstoneM6Request')
      .selectOption('post');

    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('10/15');

    await calculate(page);

    await expect(page.locator('#capstoneSummaryScore'))
      .toHaveText('95/100');

    await expect(
      page.locator('#capstoneSummaryBreakdown li').last()
    ).toContainText('10/15');

    await expect(
      page.locator('#capstoneSummaryBreakdown li')
    ).toHaveCount(6);
  });

  test('invalidates a previous score when answers change', async ({ page }) => {
    await reviewAll(page);
    await calculate(page);

    await expect(page.locator('#capstoneSummaryScore'))
      .toHaveText('100/100');

    // Changing a reviewed answer makes the combined result stale.
    await page.locator('#capstoneM3Heading')
      .selectOption('url');

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();

    await calculate(page);

    await expect(page.locator('#capstoneSummaryStatus'))
      .toContainText('Mission 3');

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();

    // Review the updated Mission 3 before recalculating.
    await page.locator('#capstoneM3Review').click();

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('15/20');

    await calculate(page);

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeVisible();

    await expect(page.locator('#capstoneSummaryScore'))
      .toHaveText('95/100');
  });

  test('reset preserves other drafts and My Progress', async ({ page }) => {
    const existingProgress = JSON.stringify({
      version: 1,
      sessions: [{ id: 'existing-session', score: 85 }]
    });

    await page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, { key: progressKey, value: existingProgress });

    await reviewAll(page);
    await calculate(page);

    const draftKeys = missions.map(
      mission => `practical-qa-capstone-m${mission.number}-draft-v1`
    );

    const before = await page.evaluate(keys =>
      keys.map(key => localStorage.getItem(key)),
      draftKeys
    );

    await page.locator('#capstoneM4Reset').click();

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();

    await calculate(page);

    await expect(page.locator('#capstoneSummaryStatus'))
      .toContainText('Mission 4');

    const after = await page.evaluate(
      ({ keys, progress }) => ({
        drafts: keys.map(key => localStorage.getItem(key)),
        progress: localStorage.getItem(progress)
      }),
      { keys: draftKeys, progress: progressKey }
    );

    for (let i = 0; i < 6; i++) {
      if (i === 3) {
        expect(after.drafts[i]).toBeNull();
      } else {
        expect(after.drafts[i]).toBe(before[i]);
      }
    }

    expect(after.progress).toBe(existingProgress);
  });

  test('restores drafts but not unreviewed scores after refresh', async ({ page }) => {
    await reviewAll(page);
    await calculate(page);

    await expect(page.locator('#capstoneSummaryScore'))
      .toHaveText('100/100');

    await page.reload();

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');

    await expect(page.locator('#capstoneM6Request'))
      .toHaveValue('get');

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();

    await calculate(page);

    await expect(page.locator('#capstoneSummaryStatus'))
      .toContainText('Mission 1');

    // Restored selections are not automatically reviewed.
    for (const mission of missions) {
      await page.locator(
        `#capstoneM${mission.number}Review`
      ).click();

      await expect(
        page.locator(`#capstoneM${mission.number}Score`)
      ).toHaveText(`${mission.max}/${mission.max}`);
    }

    await calculate(page);

    await expect(page.locator('#capstoneSummaryScore'))
      .toHaveText('100/100');
  });

});
