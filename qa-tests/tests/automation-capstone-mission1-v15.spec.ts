import { test, expect, type Page } from '@playwright/test';

const path = '/automation-lab/capstone/';
const draftKey = 'practical-qa-capstone-m1-draft-v1';
const progressKey = 'practicalQaLab.progress.v1';

async function chooseCorrectAnswers(page: Page) {
  await page.locator('#capstoneM1Smoke').selectOption('journey');
  await page.locator('#capstoneM1Email').selectOption('invalid-email');
  await page.locator('#capstoneM1Release').selectOption('block-and-retest');
}

test.describe('v1.5 Capstone - Mission 1', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(path);
  });

  test('displays all three assessment decisions', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: 'Test Strategy & Smoke Coverage',
        exact: true
      }).last()
    ).toBeVisible();

    await expect(
      page.locator('#capstoneM1Form fieldset')
    ).toHaveCount(3);

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Email'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Release'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Result'))
      .toBeHidden();
  });

  test('prevents incomplete assessment review', async ({ page }) => {
    await page.locator('#capstoneM1Smoke')
      .selectOption('journey');

    await page.locator('#capstoneM1Review').click();

    await expect(page.locator('#capstoneM1Status'))
      .toContainText('Choose an answer for all three');

    await expect(page.locator('#capstoneM1Result'))
      .toBeHidden();

    await expect(page.locator('#capstoneM1Score'))
      .toHaveText('0/15');

    const progress = await page.evaluate(key =>
      localStorage.getItem(key),
      progressKey
    );

    expect(progress).toBeNull();
  });

  test('awards 15/15 for all correct answers', async ({ page }) => {
    await chooseCorrectAnswers(page);

    await page.locator('#capstoneM1Review').click();

    await expect(page.locator('#capstoneM1Result'))
      .toBeVisible();

    await expect(page.locator('#capstoneM1Score'))
      .toHaveText('15/15');

    const feedback = page.locator(
      '#capstoneM1Feedback li'
    );

    await expect(feedback).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      await expect(feedback.nth(i))
        .toContainText('5/5 points');
    }

    await expect(page.locator('#capstoneM1Status'))
      .toContainText('not yet saved to My Progress');

    const progress = await page.evaluate(key =>
      localStorage.getItem(key),
      progressKey
    );

    expect(progress).toBeNull();
  });

  test('awards 10/15 and recalculates after correction', async ({ page }) => {
    await page.locator('#capstoneM1Smoke')
      .selectOption('cosmetic');

    await page.locator('#capstoneM1Email')
      .selectOption('invalid-email');

    await page.locator('#capstoneM1Release')
      .selectOption('block-and-retest');

    await page.locator('#capstoneM1Review').click();

    await expect(page.locator('#capstoneM1Score'))
      .toHaveText('10/15');

    await expect(
      page.locator('#capstoneM1Feedback li').first()
    ).toContainText('0/5 points');

    // Changing an answer must hide outdated feedback.
    await page.locator('#capstoneM1Smoke')
      .selectOption('journey');

    await expect(page.locator('#capstoneM1Result'))
      .toBeHidden();

    await page.locator('#capstoneM1Review').click();

    await expect(page.locator('#capstoneM1Score'))
      .toHaveText('15/15');

    await expect(
      page.locator('#capstoneM1Feedback li').first()
    ).toContainText('5/5 points');
  });

  test('restores drafts and clears only Mission 1 data', async ({ page }) => {
    // Simulate an existing draft from another module.
    const otherKey = 'practical-qa-automation-m6-draft-v1';
    const otherDraft = JSON.stringify({
      request: 'correct'
    });

    await page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, { key: otherKey, value: otherDraft });

    await chooseCorrectAnswers(page);

    const savedDraft = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '{}'),
      draftKey
    );

    expect(savedDraft).toEqual({
      capstoneM1Smoke: 'journey',
      capstoneM1Email: 'invalid-email',
      capstoneM1Release: 'block-and-retest'
    });

    await page.reload();

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');

    await expect(page.locator('#capstoneM1Email'))
      .toHaveValue('invalid-email');

    await expect(page.locator('#capstoneM1Release'))
      .toHaveValue('block-and-retest');

    // Reviewing after refresh must still work.
    await page.locator('#capstoneM1Review').click();

    await expect(page.locator('#capstoneM1Score'))
      .toHaveText('15/15');

    await page.locator('#capstoneM1Reset').click();

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Email'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Release'))
      .toHaveValue('');

    await expect(page.locator('#capstoneM1Result'))
      .toBeHidden();

    const remaining = await page.evaluate(({ draftKey, otherKey }) => ({
      missionDraft: localStorage.getItem(draftKey),
      otherDraft: localStorage.getItem(otherKey)
    }), { draftKey, otherKey });

    expect(remaining.missionDraft).toBeNull();
    expect(remaining.otherDraft).toBe(otherDraft);

    await page.reload();

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('');
  });

});
