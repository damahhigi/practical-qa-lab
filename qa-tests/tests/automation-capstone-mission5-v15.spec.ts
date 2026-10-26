import { test, expect, type Page } from '@playwright/test';

const capstonePath = '/automation-lab/capstone/';

const keys = {
  m1: 'practical-qa-capstone-m1-draft-v1',
  m2: 'practical-qa-capstone-m2-draft-v1',
  m3: 'practical-qa-capstone-m3-draft-v1',
  m4: 'practical-qa-capstone-m4-draft-v1',
  m5: 'practical-qa-capstone-m5-draft-v1',
  progress: 'practicalQaLab.progress.v1'
};

const decisionIds = [
  'capstoneM5Waiting',
  'capstoneM5Locator',
  'capstoneM5Isolation'
];

async function chooseCorrectAnswers(page: Page) {
  await page.locator('#capstoneM5Waiting')
    .selectOption('retry-assertion');

  await page.locator('#capstoneM5Locator')
    .selectOption('scoped-role');

  await page.locator('#capstoneM5Isolation')
    .selectOption('isolated-state');
}

test.describe('v1.5 Capstone - Mission 5', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);
  });

  test('displays three debugging decisions', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Debugging Flaky Tests',
        exact: true
      }).last()
    ).toBeVisible();

    await expect(
      page.locator('#capstoneM5Form fieldset')
    ).toHaveCount(3);

    for (const id of decisionIds) {
      await expect(page.locator('#' + id))
        .toHaveValue('');
    }

    await expect(page.locator('#capstoneM5Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM5Score'))
      .toHaveText('0/15');
  });

  test('prevents incomplete assessment review', async ({ page }) => {
    await page.locator('#capstoneM5Waiting')
      .selectOption('retry-assertion');

    await page.locator('#capstoneM5Review').click();

    await expect(page.locator('#capstoneM5Status'))
      .toContainText(
        'Choose an answer for all three decisions'
      );

    await expect(page.locator('#capstoneM5Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM5Score'))
      .toHaveText('0/15');
  });

  test('awards 15/15 and displays three feedback items', async ({ page }) => {
    await chooseCorrectAnswers(page);

    await page.locator('#capstoneM5Review').click();

    await expect(page.locator('#capstoneM5Result'))
      .toBeVisible();

    await expect(page.locator('#capstoneM5Score'))
      .toHaveText('15/15');

    const feedback = page.locator('#capstoneM5Feedback li');

    await expect(feedback).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      await expect(feedback.nth(i))
        .toContainText('5/5 points');
    }

    await expect(page.locator('#capstoneM5Status'))
      .toContainText('not yet saved to My Progress');

    // Repeated reviews must not duplicate feedback.
    await page.locator('#capstoneM5Review').click();

    await expect(feedback).toHaveCount(3);

    await expect(page.locator('#capstoneM5Score'))
      .toHaveText('15/15');
  });

  test('awards 10/15 and recalculates after correction', async ({ page }) => {
    await page.locator('#capstoneM5Waiting')
      .selectOption('long-timeout');

    await page.locator('#capstoneM5Locator')
      .selectOption('scoped-role');

    await page.locator('#capstoneM5Isolation')
      .selectOption('isolated-state');

    await page.locator('#capstoneM5Review').click();

    await expect(page.locator('#capstoneM5Score'))
      .toHaveText('10/15');

    await expect(
      page.locator('#capstoneM5Feedback li').first()
    ).toContainText('0/5 points');

    // Changing an answer must hide outdated feedback.
    await page.locator('#capstoneM5Waiting')
      .selectOption('retry-assertion');

    await expect(page.locator('#capstoneM5Result'))
      .toBeHidden();

    await page.locator('#capstoneM5Review').click();

    await expect(page.locator('#capstoneM5Score'))
      .toHaveText('15/15');

    await expect(
      page.locator('#capstoneM5Feedback li').first()
    ).toContainText('5/5 points');
  });

  test('restores drafts and resets only Mission 5', async ({ page }) => {
    const earlierDrafts = {
      [keys.m1]: JSON.stringify({
        capstoneM1Smoke: 'journey',
        capstoneM1Email: 'invalid-email',
        capstoneM1Release: 'block-and-retest'
      }),
      [keys.m2]: JSON.stringify({
        capstoneM2Product: 'role',
        capstoneM2Cart: 'role',
        capstoneM2Quantity: 'label',
        capstoneM2Subtotal: 'subtotal'
      }),
      [keys.m3]: JSON.stringify({
        capstoneM3Heading: 'heading',
        capstoneM3Price: 'price',
        capstoneM3Quantity: 'value',
        capstoneM3Subtotal: 'subtotal'
      }),
      [keys.m4]: JSON.stringify({
        capstoneM4Boundaries: 'edges',
        capstoneM4CartState: 'unchanged',
        capstoneM4Email: 'both'
      })
    };

    // Seed independent drafts for earlier missions.
    await page.evaluate(drafts => {
      for (const [key, value] of Object.entries(drafts)) {
        localStorage.setItem(key, value);
      }
    }, earlierDrafts);

    await chooseCorrectAnswers(page);

    const saved = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '{}'),
      keys.m5
    );

    expect(saved).toEqual({
      capstoneM5Waiting: 'retry-assertion',
      capstoneM5Locator: 'scoped-role',
      capstoneM5Isolation: 'isolated-state'
    });

    await page.reload();

    await expect(page.locator('#capstoneM5Waiting'))
      .toHaveValue('retry-assertion');

    await expect(page.locator('#capstoneM5Locator'))
      .toHaveValue('scoped-role');

    await expect(page.locator('#capstoneM5Isolation'))
      .toHaveValue('isolated-state');

    await page.locator('#capstoneM5Review').click();

    await expect(page.locator('#capstoneM5Score'))
      .toHaveText('15/15');

    await page.locator('#capstoneM5Reset').click();

    for (const id of decisionIds) {
      await expect(page.locator('#' + id))
        .toHaveValue('');
    }

    await expect(page.locator('#capstoneM5Result'))
      .toBeHidden();

    const remaining = await page.evaluate(allKeys => ({
      m1: localStorage.getItem(allKeys.m1),
      m2: localStorage.getItem(allKeys.m2),
      m3: localStorage.getItem(allKeys.m3),
      m4: localStorage.getItem(allKeys.m4),
      m5: localStorage.getItem(allKeys.m5)
    }), keys);

    expect(remaining.m1).toBe(earlierDrafts[keys.m1]);
    expect(remaining.m2).toBe(earlierDrafts[keys.m2]);
    expect(remaining.m3).toBe(earlierDrafts[keys.m3]);
    expect(remaining.m4).toBe(earlierDrafts[keys.m4]);
    expect(remaining.m5).toBeNull();

    await page.reload();

    await expect(page.locator('#capstoneM5Waiting'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');

    await expect(page.locator('#capstoneM2Product'))
      .toHaveValue('role');

    await expect(page.locator('#capstoneM3Heading'))
      .toHaveValue('heading');

    await expect(page.locator('#capstoneM4Boundaries'))
      .toHaveValue('edges');
  });

  test('preserves existing My Progress data', async ({ page }) => {
    const existingProgress = JSON.stringify({
      version: 1,
      sessions: [
        {
          id: 'existing-learner-session',
          score: 85
        }
      ]
    });

    await page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, {
      key: keys.progress,
      value: existingProgress
    });

    await chooseCorrectAnswers(page);

    await page.locator('#capstoneM5Review').click();

    await expect(page.locator('#capstoneM5Score'))
      .toHaveText('15/15');

    const afterReview = await page.evaluate(key =>
      localStorage.getItem(key),
      keys.progress
    );

    expect(afterReview).toBe(existingProgress);

    await page.locator('#capstoneM5Reset').click();

    const afterReset = await page.evaluate(key =>
      localStorage.getItem(key),
      keys.progress
    );

    expect(afterReset).toBe(existingProgress);
  });

});
