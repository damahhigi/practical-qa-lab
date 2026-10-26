import { test, expect, type Page } from '@playwright/test';

const capstonePath = '/automation-lab/capstone/';

const keys = {
  m1: 'practical-qa-capstone-m1-draft-v1',
  m2: 'practical-qa-capstone-m2-draft-v1',
  m3: 'practical-qa-capstone-m3-draft-v1',
  m4: 'practical-qa-capstone-m4-draft-v1',
  progress: 'practicalQaLab.progress.v1'
};

const decisionIds = [
  'capstoneM4Boundaries',
  'capstoneM4CartState',
  'capstoneM4Email'
];

async function chooseCorrectAnswers(page: Page) {
  await page.locator('#capstoneM4Boundaries')
    .selectOption('edges');

  await page.locator('#capstoneM4CartState')
    .selectOption('unchanged');

  await page.locator('#capstoneM4Email')
    .selectOption('both');
}

test.describe('v1.5 Capstone - Mission 4', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);
  });

  test('displays three boundary testing decisions', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Negative & Boundary Testing',
        exact: true
      }).last()
    ).toBeVisible();

    await expect(
      page.locator('#capstoneM4Form fieldset')
    ).toHaveCount(3);

    for (const id of decisionIds) {
      await expect(page.locator('#' + id))
        .toHaveValue('');
    }

    await expect(page.locator('#capstoneM4Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM4Score'))
      .toHaveText('0/15');
  });

  test('prevents incomplete assessment review', async ({ page }) => {
    await page.locator('#capstoneM4Boundaries')
      .selectOption('edges');

    await page.locator('#capstoneM4Review').click();

    await expect(page.locator('#capstoneM4Status'))
      .toContainText(
        'Choose an answer for all three decisions'
      );

    await expect(page.locator('#capstoneM4Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM4Score'))
      .toHaveText('0/15');
  });

  test('awards 15/15 with three feedback items', async ({ page }) => {
    await chooseCorrectAnswers(page);

    await page.locator('#capstoneM4Review').click();

    await expect(page.locator('#capstoneM4Result'))
      .toBeVisible();

    await expect(page.locator('#capstoneM4Score'))
      .toHaveText('15/15');

    const feedback = page.locator('#capstoneM4Feedback li');

    await expect(feedback).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      await expect(feedback.nth(i))
        .toContainText('5/5 points');
    }

    await expect(page.locator('#capstoneM4Status'))
      .toContainText('not yet saved to My Progress');

    // Repeated reviews must not duplicate feedback.
    await page.locator('#capstoneM4Review').click();

    await expect(feedback).toHaveCount(3);

    await expect(page.locator('#capstoneM4Score'))
      .toHaveText('15/15');
  });

  test('awards 10/15 and recalculates after correction', async ({ page }) => {
    await page.locator('#capstoneM4Boundaries')
      .selectOption('happy-only');

    await page.locator('#capstoneM4CartState')
      .selectOption('unchanged');

    await page.locator('#capstoneM4Email')
      .selectOption('both');

    await page.locator('#capstoneM4Review').click();

    await expect(page.locator('#capstoneM4Score'))
      .toHaveText('10/15');

    await expect(
      page.locator('#capstoneM4Feedback li').first()
    ).toContainText('0/5 points');

    // Correcting an answer must hide outdated results.
    await page.locator('#capstoneM4Boundaries')
      .selectOption('edges');

    await expect(page.locator('#capstoneM4Result'))
      .toBeHidden();

    await page.locator('#capstoneM4Review').click();

    await expect(page.locator('#capstoneM4Score'))
      .toHaveText('15/15');

    await expect(
      page.locator('#capstoneM4Feedback li').first()
    ).toContainText('5/5 points');
  });

  test('restores drafts and resets only Mission 4', async ({ page }) => {
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
      })
    };

    await page.evaluate(drafts => {
      for (const [key, value] of Object.entries(drafts)) {
        localStorage.setItem(key, value);
      }
    }, earlierDrafts);

    await chooseCorrectAnswers(page);

    const saved = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '{}'),
      keys.m4
    );

    expect(saved).toEqual({
      capstoneM4Boundaries: 'edges',
      capstoneM4CartState: 'unchanged',
      capstoneM4Email: 'both'
    });

    await page.reload();

    await expect(page.locator('#capstoneM4Boundaries'))
      .toHaveValue('edges');

    await expect(page.locator('#capstoneM4CartState'))
      .toHaveValue('unchanged');

    await expect(page.locator('#capstoneM4Email'))
      .toHaveValue('both');

    await page.locator('#capstoneM4Review').click();

    await expect(page.locator('#capstoneM4Score'))
      .toHaveText('15/15');

    await page.locator('#capstoneM4Reset').click();

    for (const id of decisionIds) {
      await expect(page.locator('#' + id))
        .toHaveValue('');
    }

    await expect(page.locator('#capstoneM4Result'))
      .toBeHidden();

    const remaining = await page.evaluate(allKeys => {
      return {
        m1: localStorage.getItem(allKeys.m1),
        m2: localStorage.getItem(allKeys.m2),
        m3: localStorage.getItem(allKeys.m3),
        m4: localStorage.getItem(allKeys.m4)
      };
    }, keys);

    expect(remaining.m1).toBe(earlierDrafts[keys.m1]);
    expect(remaining.m2).toBe(earlierDrafts[keys.m2]);
    expect(remaining.m3).toBe(earlierDrafts[keys.m3]);
    expect(remaining.m4).toBeNull();

    await page.reload();

    await expect(page.locator('#capstoneM4Boundaries'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');

    await expect(page.locator('#capstoneM2Product'))
      .toHaveValue('role');

    await expect(page.locator('#capstoneM3Heading'))
      .toHaveValue('heading');
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

    await page.locator('#capstoneM4Review').click();

    await expect(page.locator('#capstoneM4Score'))
      .toHaveText('15/15');

    const afterReview = await page.evaluate(key =>
      localStorage.getItem(key),
      keys.progress
    );

    expect(afterReview).toBe(existingProgress);

    await page.locator('#capstoneM4Reset').click();

    const afterReset = await page.evaluate(key =>
      localStorage.getItem(key),
      keys.progress
    );

    expect(afterReset).toBe(existingProgress);
  });

});
