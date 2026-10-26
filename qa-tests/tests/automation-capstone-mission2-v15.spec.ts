import { test, expect, type Page } from '@playwright/test';

const capstonePath = '/automation-lab/capstone/';

const mission1Key = 'practical-qa-capstone-m1-draft-v1';
const mission2Key = 'practical-qa-capstone-m2-draft-v1';
const progressKey = 'practicalQaLab.progress.v1';

async function chooseCorrectAnswers(page: Page) {
  await page.locator('#capstoneM2Product').selectOption('role');
  await page.locator('#capstoneM2Cart').selectOption('role');
  await page.locator('#capstoneM2Quantity').selectOption('label');
  await page.locator('#capstoneM2Subtotal').selectOption('subtotal');
}

test.describe('v1.5 Capstone - Mission 2', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);
  });

  test('displays four assessment decisions', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: 'UI Locators & Interactions',
        exact: true
      }).last()
    ).toBeVisible();

    await expect(
      page.locator('#capstoneM2Form fieldset')
    ).toHaveCount(4);

    for (const id of [
      'capstoneM2Product',
      'capstoneM2Cart',
      'capstoneM2Quantity',
      'capstoneM2Subtotal'
    ]) {
      await expect(page.locator(`#${id}`)).toHaveValue('');
    }

    await expect(page.locator('#capstoneM2Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM2Score'))
      .toHaveText('0/20');
  });

  test('prevents review when answers are incomplete', async ({ page }) => {
    await page.locator('#capstoneM2Product')
      .selectOption('role');

    await page.locator('#capstoneM2Review').click();

    await expect(page.locator('#capstoneM2Status'))
      .toContainText('Choose an answer for all four decisions');

    await expect(page.locator('#capstoneM2Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM2Score'))
      .toHaveText('0/20');
  });

  test('awards 20/20 for all correct answers', async ({ page }) => {
    await chooseCorrectAnswers(page);

    await page.locator('#capstoneM2Review').click();

    await expect(page.locator('#capstoneM2Result'))
      .toBeVisible();

    await expect(page.locator('#capstoneM2Score'))
      .toHaveText('20/20');

    const feedback = page.locator('#capstoneM2Feedback li');

    await expect(feedback).toHaveCount(4);

    for (let i = 0; i < 4; i++) {
      await expect(feedback.nth(i))
        .toContainText('5/5 points');
    }

    await expect(page.locator('#capstoneM2Status'))
      .toContainText('not yet saved to My Progress');

    // Reviewing twice must not duplicate feedback.
    await page.locator('#capstoneM2Review').click();

    await expect(feedback).toHaveCount(4);

    await expect(page.locator('#capstoneM2Score'))
      .toHaveText('20/20');
  });

  test('awards 15/20 and recalculates after correction', async ({ page }) => {
    await page.locator('#capstoneM2Product')
      .selectOption('css');

    await page.locator('#capstoneM2Cart')
      .selectOption('role');

    await page.locator('#capstoneM2Quantity')
      .selectOption('label');

    await page.locator('#capstoneM2Subtotal')
      .selectOption('subtotal');

    await page.locator('#capstoneM2Review').click();

    await expect(page.locator('#capstoneM2Score'))
      .toHaveText('15/20');

    await expect(
      page.locator('#capstoneM2Feedback li').first()
    ).toContainText('0/5 points');

    // Changing an answer must hide outdated feedback.
    await page.locator('#capstoneM2Product')
      .selectOption('role');

    await expect(page.locator('#capstoneM2Result'))
      .toBeHidden();

    await page.locator('#capstoneM2Review').click();

    await expect(page.locator('#capstoneM2Score'))
      .toHaveText('20/20');

    await expect(
      page.locator('#capstoneM2Feedback li').first()
    ).toContainText('5/5 points');
  });

  test('restores drafts and resets only Mission 2', async ({ page }) => {
    const mission1Draft = JSON.stringify({
      capstoneM1Smoke: 'journey',
      capstoneM1Email: 'invalid-email',
      capstoneM1Release: 'block-and-retest'
    });

    // Preserve a separate Mission 1 draft.
    await page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, {
      key: mission1Key,
      value: mission1Draft
    });

    await chooseCorrectAnswers(page);

    const savedDraft = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '{}'),
      mission2Key
    );

    expect(savedDraft).toEqual({
      capstoneM2Product: 'role',
      capstoneM2Cart: 'role',
      capstoneM2Quantity: 'label',
      capstoneM2Subtotal: 'subtotal'
    });

    await page.reload();

    await expect(page.locator('#capstoneM2Product'))
      .toHaveValue('role');

    await expect(page.locator('#capstoneM2Cart'))
      .toHaveValue('role');

    await expect(page.locator('#capstoneM2Quantity'))
      .toHaveValue('label');

    await expect(page.locator('#capstoneM2Subtotal'))
      .toHaveValue('subtotal');

    await page.locator('#capstoneM2Review').click();

    await expect(page.locator('#capstoneM2Score'))
      .toHaveText('20/20');

    await page.locator('#capstoneM2Reset').click();

    for (const id of [
      'capstoneM2Product',
      'capstoneM2Cart',
      'capstoneM2Quantity',
      'capstoneM2Subtotal'
    ]) {
      await expect(page.locator(`#${id}`)).toHaveValue('');
    }

    await expect(page.locator('#capstoneM2Result'))
      .toBeHidden();

    const remaining = await page.evaluate(({ m1, m2 }) => ({
      mission1: localStorage.getItem(m1),
      mission2: localStorage.getItem(m2)
    }), {
      m1: mission1Key,
      m2: mission2Key
    });

    expect(remaining.mission1).toBe(mission1Draft);
    expect(remaining.mission2).toBeNull();

    await page.reload();

    await expect(page.locator('#capstoneM2Product'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');
  });

  test('does not modify existing My Progress data', async ({ page }) => {
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

    await page.locator('#capstoneM2Review').click();

    await expect(page.locator('#capstoneM2Score'))
      .toHaveText('20/20');

    const afterReview = await page.evaluate(key =>
      localStorage.getItem(key),
      progressKey
    );

    expect(afterReview).toBe(existingProgress);

    await page.locator('#capstoneM2Reset').click();

    const afterReset = await page.evaluate(key =>
      localStorage.getItem(key),
      progressKey
    );

    expect(afterReset).toBe(existingProgress);
  });

});
