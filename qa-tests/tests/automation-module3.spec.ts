import { test, expect } from '@playwright/test';

test.describe('Test Automation Lab - Module 3', () => {

  test('loads Module 3 and all four assertion exercises', async ({ page }) => {
    await page.goto('/automation-lab/module-3/');

    await expect(page).toHaveTitle(
      /Assertions & Validation/
    );

    await expect(page.getByRole('heading', {
      name: 'Prove that the application behaved correctly.'
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

  test('prevents reviewing incomplete assertions', async ({ page }) => {
    await page.goto('/automation-lab/module-3/');

    // Complete only Exercise 1.
    await page.locator('#visibleChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#visibleSelected'))
      .toContainText('toBeVisible()');

    // Attempt to review an incomplete assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText('Complete stage 2: Exact success message.');

    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // The unanswered Exercise 2 must receive focus.
    await expect(page.locator('#messageChoice'))
      .toBeFocused();

    // The learner's first answer must remain selected.
    await expect(page.locator('#visibleChoice'))
      .toHaveValue('correct');

    // Module 3 is not integrated with My Progress yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('restores the selected assertion after refresh', async ({ page }) => {
    await page.goto('/automation-lab/module-3/');

    // Select the correct visibility assertion.
    await page.locator('#visibleChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#visibleSelected'))
      .toContainText('toBeVisible()');

    await expect(page.locator('#codePreview'))
      .toContainText('toBeVisible()');

    // Refresh the page.
    await page.reload();

    // Verify the answer and preview are restored.
    await expect(page.locator('#visibleChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    await expect(page.locator('#visibleSelected'))
      .toContainText('toBeVisible()');

    await expect(page.locator('#codePreview'))
      .toContainText('toBeVisible()');

    // A saved draft must not create a My Progress session.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('scores a missing await assertion at 80/100', async ({ page }) => {
    await page.goto('/automation-lab/module-3/');

    // One incorrect assertion and three correct answers.
    await page.locator('#visibleChoice').selectOption('wrong1');
    await page.locator('#messageChoice').selectOption('correct');
    await page.locator('#urlChoice').selectOption('correct');
    await page.locator('#stateChoice').selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    // Review the assessment.
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
      .toContainText('25/25 points');

    await expect(feedback.nth(3))
      .toContainText('30/30 points');

    // The incorrect answer should explain the missing await.
    await expect(feedback.nth(0))
      .toContainText('Needs revision');

    await expect(feedback.nth(0))
      .toContainText('Omitting await');

    // Confirm this is a simulated assessment.
    await expect(page.locator('#reviewMessage'))
      .toContainText('simulated assessment');

    // Module 3 must not write to My Progress yet.
    // Verify the 80/100 assessment is saved.
    const progress = await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem('practicalQaLab.progress.v1') || '[]'
      )
    );

    expect(progress).toHaveLength(1);

    expect(progress[0]).toMatchObject({
      id: 'automation-m3-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 25, 30]
    });

    // Reviewing unchanged answers must not add a duplicate.
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


  test('updates the score from 80 to 100 after correcting an assertion', async ({ page }) => {
    await page.goto('/automation-lab/module-3/');

    // Begin with one incorrect assertion.
    await page.locator('#visibleChoice').selectOption('wrong1');
    await page.locator('#messageChoice').selectOption('correct');
    await page.locator('#urlChoice').selectOption('correct');
    await page.locator('#stateChoice').selectOption('correct');

    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    // Correct Exercise 1 by selecting the awaited assertion.
    await page.locator('#visibleChoice')
      .selectOption('correct');

    // Previous assessment feedback must disappear.
    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // The generated code must reflect the correction.
    await expect(page.locator('#codePreview'))
      .toContainText(
        "await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible();"
      );

    // Review the corrected assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#reviewResult'))
      .toBeVisible();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // Verify that each exercise receives full marks.
    const feedback = page.locator('#feedbackList .feedback-item');

    await expect(feedback).toHaveCount(4);

    await expect(feedback.nth(0)).toContainText('20/20 points');
    await expect(feedback.nth(1)).toContainText('25/25 points');
    await expect(feedback.nth(2)).toContainText('25/25 points');
    await expect(feedback.nth(3)).toContainText('30/30 points');

    // Refresh and verify all correct answers are preserved.
    await page.reload();

    await expect(page.locator('#visibleChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#messageChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#urlChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#stateChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    // The restored answers must still earn full marks.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // My Progress integration is intentionally not enabled yet.
    // The original and corrected attempts must both be saved.
    const progress = await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem('practicalQaLab.progress.v1') || '[]'
      )
    );

    expect(progress).toHaveLength(2);

    expect(progress[0]).toMatchObject({
      id: 'automation-m3-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      questionScores: [20, 25, 25, 30]
    });

    expect(progress[1]).toMatchObject({
      id: 'automation-m3-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 25, 30]
    });

    // Refreshing and reviewing again must detect the duplicate.
    await expect(page.locator('#formStatus'))
      .toContainText('already saved in My Progress');
  });

});
