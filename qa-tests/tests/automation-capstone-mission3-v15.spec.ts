import { test, expect, type Page } from '@playwright/test';

const capstonePath = '/automation-lab/capstone/';

const mission1Key = 'practical-qa-capstone-m1-draft-v1';
const mission2Key = 'practical-qa-capstone-m2-draft-v1';
const mission3Key = 'practical-qa-capstone-m3-draft-v1';
const progressKey = 'practicalQaLab.progress.v1';

const decisionIds = [
  'capstoneM3Heading',
  'capstoneM3Price',
  'capstoneM3Quantity',
  'capstoneM3Subtotal'
];

async function chooseCorrectAnswers(page: Page) {
  await page.locator('#capstoneM3Heading')
    .selectOption('heading');

  await page.locator('#capstoneM3Price')
    .selectOption('price');

  await page.locator('#capstoneM3Quantity')
    .selectOption('value');

  await page.locator('#capstoneM3Subtotal')
    .selectOption('subtotal');
}

test.describe('v1.5 Capstone - Mission 3', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);
  });

  test('displays four assertion decisions', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Assertions & State Validation',
        exact: true
      }).last()
    ).toBeVisible();

    await expect(
      page.locator('#capstoneM3Form fieldset')
    ).toHaveCount(4);

    for (const id of decisionIds) {
      await expect(page.locator(`#${id}`))
        .toHaveValue('');
    }

    await expect(page.locator('#capstoneM3Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('0/20');
  });

  test('prevents incomplete assessment review', async ({ page }) => {
    await page.locator('#capstoneM3Heading')
      .selectOption('heading');

    await page.locator('#capstoneM3Review').click();

    await expect(page.locator('#capstoneM3Status'))
      .toContainText(
        'Choose an answer for all four decisions'
      );

    await expect(page.locator('#capstoneM3Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('0/20');
  });

  test('awards 20/20 and shows four feedback items', async ({ page }) => {
    await chooseCorrectAnswers(page);

    await page.locator('#capstoneM3Review').click();

    await expect(page.locator('#capstoneM3Result'))
      .toBeVisible();

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('20/20');

    const feedback = page.locator(
      '#capstoneM3Feedback li'
    );

    await expect(feedback).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      await expect(feedback.nth(i))
        .toContainText('5/5 points');
    }

    await expect(page.locator('#capstoneM3Status'))
      .toContainText('not yet saved to My Progress');

    // Repeated reviews must replace, not duplicate, feedback.
    await page.locator('#capstoneM3Review').click();

    await expect(feedback).toHaveCount(4);

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('20/20');
  });

  test('awards 15/20 and recalculates after correction', async ({ page }) => {
    await page.locator('#capstoneM3Heading')
      .selectOption('url');

    await page.locator('#capstoneM3Price')
      .selectOption('price');

    await page.locator('#capstoneM3Quantity')
      .selectOption('value');

    await page.locator('#capstoneM3Subtotal')
      .selectOption('subtotal');

    await page.locator('#capstoneM3Review').click();

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('15/20');

    await expect(
      page.locator('#capstoneM3Feedback li').first()
    ).toContainText('0/5 points');

    // Correcting the answer must hide outdated results.
    await page.locator('#capstoneM3Heading')
      .selectOption('heading');

    await expect(page.locator('#capstoneM3Result'))
      .toBeHidden();

    await page.locator('#capstoneM3Review').click();

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('20/20');

    await expect(
      page.locator('#capstoneM3Feedback li').first()
    ).toContainText('5/5 points');
  });

  test('restores drafts and resets only Mission 3', async ({ page }) => {
    const mission1Draft = JSON.stringify({
      capstoneM1Smoke: 'journey',
      capstoneM1Email: 'invalid-email',
      capstoneM1Release: 'block-and-retest'
    });

    const mission2Draft = JSON.stringify({
      capstoneM2Product: 'role',
      capstoneM2Cart: 'role',
      capstoneM2Quantity: 'label',
      capstoneM2Subtotal: 'subtotal'
    });

    // Seed independent drafts for earlier missions.
    await page.evaluate(({ m1, m2, key1, key2 }) => {
      localStorage.setItem(key1, m1);
      localStorage.setItem(key2, m2);
    }, {
      m1: mission1Draft,
      m2: mission2Draft,
      key1: mission1Key,
      key2: mission2Key
    });

    await chooseCorrectAnswers(page);

    const saved = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '{}'),
      mission3Key
    );

    expect(saved).toEqual({
      capstoneM3Heading: 'heading',
      capstoneM3Price: 'price',
      capstoneM3Quantity: 'value',
      capstoneM3Subtotal: 'subtotal'
    });

    await page.reload();

    await expect(page.locator('#capstoneM3Heading'))
      .toHaveValue('heading');

    await expect(page.locator('#capstoneM3Price'))
      .toHaveValue('price');

    await expect(page.locator('#capstoneM3Quantity'))
      .toHaveValue('value');

    await expect(page.locator('#capstoneM3Subtotal'))
      .toHaveValue('subtotal');

    // Previous mission drafts should also restore.
    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');

    await expect(page.locator('#capstoneM2Product'))
      .toHaveValue('role');

    await page.locator('#capstoneM3Review').click();

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('20/20');

    await page.locator('#capstoneM3Reset').click();

    for (const id of decisionIds) {
      await expect(page.locator(`#${id}`))
        .toHaveValue('');
    }

    await expect(page.locator('#capstoneM3Result'))
      .toBeHidden();

    const remaining = await page.evaluate(
      ({ key1, key2, key3 }) => ({
        mission1: localStorage.getItem(key1),
        mission2: localStorage.getItem(key2),
        mission3: localStorage.getItem(key3)
      }),
      {
        key1: mission1Key,
        key2: mission2Key,
        key3: mission3Key
      }
    );

    expect(remaining.mission1).toBe(mission1Draft);
    expect(remaining.mission2).toBe(mission2Draft);
    expect(remaining.mission3).toBeNull();

    await page.reload();

    await expect(page.locator('#capstoneM3Heading'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');

    await expect(page.locator('#capstoneM2Product'))
      .toHaveValue('role');
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
      key: progressKey,
      value: existingProgress
    });

    await chooseCorrectAnswers(page);

    await page.locator('#capstoneM3Review').click();

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('20/20');

    const afterReview = await page.evaluate(key =>
      localStorage.getItem(key),
      progressKey
    );

    expect(afterReview).toBe(existingProgress);

    await page.locator('#capstoneM3Reset').click();

    const afterReset = await page.evaluate(key =>
      localStorage.getItem(key),
      progressKey
    );

    expect(afterReset).toBe(existingProgress);
  });

});
