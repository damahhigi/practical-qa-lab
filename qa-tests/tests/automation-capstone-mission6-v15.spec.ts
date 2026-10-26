import { test, expect, type Page } from '@playwright/test';

const capstonePath = '/automation-lab/capstone/';

const keys = {
  m1: 'practical-qa-capstone-m1-draft-v1',
  m2: 'practical-qa-capstone-m2-draft-v1',
  m3: 'practical-qa-capstone-m3-draft-v1',
  m4: 'practical-qa-capstone-m4-draft-v1',
  m5: 'practical-qa-capstone-m5-draft-v1',
  m6: 'practical-qa-capstone-m6-draft-v1',
  progress: 'practicalQaLab.progress.v1'
};

const decisionIds = [
  'capstoneM6Request',
  'capstoneM6Contract',
  'capstoneM6Missing'
];

async function chooseCorrectAnswers(page: Page) {
  await page.locator('#capstoneM6Request')
    .selectOption('get');

  await page.locator('#capstoneM6Contract')
    .selectOption('contract');

  await page.locator('#capstoneM6Missing')
    .selectOption('not-found');
}

test.describe('v1.5 Capstone - Mission 6', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);
  });

  test('displays three API validation decisions', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: 'API Contract Validation',
        exact: true
      }).last()
    ).toBeVisible();

    await expect(
      page.locator('#capstoneM6Form fieldset')
    ).toHaveCount(3);

    for (const id of decisionIds) {
      await expect(page.locator('#' + id))
        .toHaveValue('');
    }

    // Verify the fictional API requirements are represented.
    await expect(page.locator('#capstoneM6Request'))
      .toContainText('/api/products/42');

    await expect(page.locator('#capstoneM6Contract'))
      .toContainText('priceKES: 2400');

    await expect(page.locator('#capstoneM6Missing'))
      .toContainText('/api/products/9999');

    await expect(page.locator('#capstoneM6Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('0/15');
  });

  test('prevents incomplete assessment review', async ({ page }) => {
    await page.locator('#capstoneM6Request')
      .selectOption('get');

    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Status'))
      .toContainText(
        'Choose an answer for all three decisions'
      );

    await expect(page.locator('#capstoneM6Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('0/15');

    await expect(page.locator('#capstoneM6Feedback li'))
      .toHaveCount(0);
  });

  test('awards 15/15 and shows three feedback items', async ({ page }) => {
    await chooseCorrectAnswers(page);

    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Result'))
      .toBeVisible();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('15/15');

    const feedback = page.locator('#capstoneM6Feedback li');

    await expect(feedback).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      await expect(feedback.nth(i))
        .toContainText('5/5 points');
    }

    await expect(page.locator('#capstoneM6Status'))
      .toContainText('not yet saved to My Progress');

    // Repeated reviews must replace, not duplicate, feedback.
    await page.locator('#capstoneM6Review').click();

    await expect(feedback).toHaveCount(3);

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('15/15');
  });

  test('awards 10/15 and recalculates after correction', async ({ page }) => {
    await page.locator('#capstoneM6Request')
      .selectOption('post');

    await page.locator('#capstoneM6Contract')
      .selectOption('contract');

    await page.locator('#capstoneM6Missing')
      .selectOption('not-found');

    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('10/15');

    await expect(
      page.locator('#capstoneM6Feedback li').first()
    ).toContainText('0/5 points');

    // Changing an answer must hide outdated feedback.
    await page.locator('#capstoneM6Request')
      .selectOption('get');

    await expect(page.locator('#capstoneM6Result'))
      .toBeHidden();

    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('15/15');

    await expect(
      page.locator('#capstoneM6Feedback li').first()
    ).toContainText('5/5 points');
  });

  test('restores drafts and resets only Mission 6', async ({ page }) => {
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
      }),
      [keys.m5]: JSON.stringify({
        capstoneM5Waiting: 'retry-assertion',
        capstoneM5Locator: 'scoped-role',
        capstoneM5Isolation: 'isolated-state'
      })
    };

    // Seed separate drafts for Missions 1–5.
    await page.evaluate(drafts => {
      for (const [key, value] of Object.entries(drafts)) {
        localStorage.setItem(key, value);
      }
    }, earlierDrafts);

    await chooseCorrectAnswers(page);

    const saved = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '{}'),
      keys.m6
    );

    expect(saved).toEqual({
      capstoneM6Request: 'get',
      capstoneM6Contract: 'contract',
      capstoneM6Missing: 'not-found'
    });

    await page.reload();

    await expect(page.locator('#capstoneM6Request'))
      .toHaveValue('get');

    await expect(page.locator('#capstoneM6Contract'))
      .toHaveValue('contract');

    await expect(page.locator('#capstoneM6Missing'))
      .toHaveValue('not-found');

    // Mission 6 must remain reviewable after refresh.
    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('15/15');

    await page.locator('#capstoneM6Reset').click();

    for (const id of decisionIds) {
      await expect(page.locator('#' + id))
        .toHaveValue('');
    }

    await expect(page.locator('#capstoneM6Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('0/15');

    const remaining = await page.evaluate(allKeys => ({
      m1: localStorage.getItem(allKeys.m1),
      m2: localStorage.getItem(allKeys.m2),
      m3: localStorage.getItem(allKeys.m3),
      m4: localStorage.getItem(allKeys.m4),
      m5: localStorage.getItem(allKeys.m5),
      m6: localStorage.getItem(allKeys.m6)
    }), keys);

    for (const number of [1, 2, 3, 4, 5]) {
      const name = 'm' + number as keyof typeof keys;
      const originalKey = keys[name];

      expect(remaining[name]).toBe(earlierDrafts[originalKey]);
    }

    expect(remaining.m6).toBeNull();

    await page.reload();

    await expect(page.locator('#capstoneM6Request'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');

    await expect(page.locator('#capstoneM2Product'))
      .toHaveValue('role');

    await expect(page.locator('#capstoneM3Heading'))
      .toHaveValue('heading');

    await expect(page.locator('#capstoneM4Boundaries'))
      .toHaveValue('edges');

    await expect(page.locator('#capstoneM5Waiting'))
      .toHaveValue('retry-assertion');
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

    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('15/15');

    const afterReview = await page.evaluate(key =>
      localStorage.getItem(key),
      keys.progress
    );

    expect(afterReview).toBe(existingProgress);

    await page.locator('#capstoneM6Reset').click();

    const afterReset = await page.evaluate(key =>
      localStorage.getItem(key),
      keys.progress
    );

    expect(afterReset).toBe(existingProgress);
  });

});
