import { test, expect } from '@playwright/test';

test.describe('Test Automation Lab - Module 2', () => {

  test('loads Module 2 and all four exercises', async ({ page }) => {
    await page.goto('/automation-lab/module-2/');

    await expect(page).toHaveTitle(
      /Locators & Interactions/
    );

    await expect(page.getByRole('heading', {
      name: 'Find the right element, every time.'
    })).toBeVisible();

    await expect(page.locator('#constructionForm fieldset'))
      .toHaveCount(4);

    await expect(page.locator('#completedCount'))
      .toHaveText('0/4');

    await expect(page.locator('#codePreview'))
      .toBeVisible();

    await expect(page.locator('#reviewButton'))
      .toBeVisible();
  });

  test('prevents reviewing an incomplete locator exercise', async ({ page }) => {
    await page.goto('/automation-lab/module-2/');

    // Complete only Exercise 1.
    await page.locator('#linkChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#linkSelected'))
      .toContainText("getByRole('link'");

    // Attempt to review the incomplete assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText('Complete stage 2: Email address input.');

    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // The next unanswered dropdown should receive focus.
    await expect(page.locator('#emailChoice'))
      .toBeFocused();

    // The selected answer must remain intact.
    await expect(page.locator('#linkChoice'))
      .toHaveValue('correct');

    // Module 2 must not write to My Progress yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('restores the selected locator after refresh', async ({ page }) => {
    await page.goto('/automation-lab/module-2/');

    // Select the correct account settings link locator.
    await page.locator('#linkChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#linkSelected'))
      .toContainText("getByRole('link', { name: 'Account settings' })");

    await expect(page.locator('#codePreview'))
      .toContainText("getByRole('link', { name: 'Account settings' })");

    // Verify that the Module 2 draft was stored.
    const savedDraft = await page.evaluate(() =>
      localStorage.getItem('practical-qa-automation-m2-draft-v1')
    );

    expect(savedDraft).not.toBeNull();
    expect(JSON.parse(savedDraft!).choices.link).toBe('correct');

    // Reload the browser page.
    await page.reload();

    // Verify the selected locator and preview are restored.
    await expect(page.locator('#linkChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    await expect(page.locator('#linkSelected'))
      .toContainText("getByRole('link', { name: 'Account settings' })");

    await expect(page.locator('#codePreview'))
      .toContainText("getByRole('link', { name: 'Account settings' })");

    // Module 2 must not create a My Progress session yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('scores an incorrect link locator at 80/100', async ({ page }) => {
    await page.goto('/automation-lab/module-2/');

    // One incorrect locator and three correct answers.
    await page.locator('#linkChoice').selectOption('wrong1');
    await page.locator('#emailChoice').selectOption('correct');
    await page.locator('#scopedChoice').selectOption('correct');
    await page.locator('#statusChoice').selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    // Submit the assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#reviewResult'))
      .toBeVisible();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    // Verify individual exercise scores.
    const feedback = page.locator('#feedbackList .feedback-item');

    await expect(feedback).toHaveCount(4);

    await expect(feedback.nth(0))
      .toContainText('0/20 points');

    await expect(feedback.nth(1))
      .toContainText('25/25 points');

    await expect(feedback.nth(2))
      .toContainText('30/30 points');

    await expect(feedback.nth(3))
      .toContainText('25/25 points');

    // Verify feedback explains the incorrect locator.
    await expect(feedback.nth(0))
      .toContainText('Needs revision');

    await expect(feedback.nth(0))
      .toContainText('depends on page order');

    // Verify the assessment does not claim to execute code.
    await expect(page.locator('#reviewMessage'))
      .toContainText('simulated assessment');

    // Module 2 should not modify My Progress yet.
    // Verify the 80/100 assessment was saved.
    const progress = await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem('practicalQaLab.progress.v1') || '[]'
      )
    );

    expect(progress).toHaveLength(1);

    expect(progress[0]).toMatchObject({
      id: 'automation-m2-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 30, 25]
    });

    // Repeating the review must not add another record.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText('already saved in My Progress');

    const repeated = await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem('practicalQaLab.progress.v1') || '[]'
      )
    );

    expect(repeated).toEqual(progress);
  });


  test('updates the score from 80 to 100 after correcting a locator', async ({ page }) => {
    await page.goto('/automation-lab/module-2/');

    // Begin with one incorrect locator.
    await page.locator('#linkChoice').selectOption('wrong1');
    await page.locator('#emailChoice').selectOption('correct');
    await page.locator('#scopedChoice').selectOption('correct');
    await page.locator('#statusChoice').selectOption('correct');

    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    // Correct Exercise 1.
    await page.locator('#linkChoice')
      .selectOption('correct');

    // The previous feedback must disappear.
    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // The generated TypeScript must reflect the correction.
    await expect(page.locator('#codePreview'))
      .toContainText("getByRole('link', { name: 'Account settings' })");

    // Review the corrected assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#reviewResult'))
      .toBeVisible();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // Verify full marks for each exercise.
    const feedback = page.locator('#feedbackList .feedback-item');

    await expect(feedback).toHaveCount(4);

    await expect(feedback.nth(0)).toContainText('20/20 points');
    await expect(feedback.nth(1)).toContainText('25/25 points');
    await expect(feedback.nth(2)).toContainText('30/30 points');
    await expect(feedback.nth(3)).toContainText('25/25 points');

    // Refresh and verify all corrected answers persist.
    await page.reload();

    await expect(page.locator('#linkChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#emailChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#scopedChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#statusChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    // Reviewing the restored draft should still award 100.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // My Progress integration is not enabled yet.
    // Both attempts must remain in My Progress.
    const progress = await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem('practicalQaLab.progress.v1') || '[]'
      )
    );

    expect(progress).toHaveLength(2);

    expect(progress[0]).toMatchObject({
      id: 'automation-m2-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      questionScores: [20, 25, 30, 25]
    });

    expect(progress[1]).toMatchObject({
      id: 'automation-m2-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 30, 25]
    });

    // Refreshing and reviewing must detect the duplicate.
    await expect(page.locator('#formStatus'))
      .toContainText('already saved in My Progress');
  });

});
