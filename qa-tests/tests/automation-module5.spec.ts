import { test, expect } from '@playwright/test';

test.describe('Test Automation Lab - Module 5', () => {

  test('loads Module 5 and all four debugging exercises', async ({ page }) => {
    await page.goto('/automation-lab/module-5/');

    await expect(page).toHaveTitle(
      /Debugging Flaky Tests/
    );

    await expect(page.locator('#page-title'))
      .toHaveText('Make flaky tests reliable.');

    await expect(page.locator('#constructionForm fieldset'))
      .toHaveCount(4);

    await expect(page.locator('#completedCount'))
      .toHaveText('0/4');

    await expect(page.locator('#codePreview'))
      .toBeVisible();

    await expect(page.locator('#reviewButton'))
      .toBeVisible();

    // Verify all four debugging exercises exist.
    await expect(page.locator('#timingChoice'))
      .toBeVisible();

    await expect(page.locator('#locatorChoice'))
      .toBeVisible();

    await expect(page.locator('#asyncChoice'))
      .toBeVisible();

    await expect(page.locator('#isolationChoice'))
      .toBeVisible();
  });

  test('prevents reviewing incomplete debugging exercises', async ({ page }) => {
    await page.goto('/automation-lab/module-5/');

    // Complete Exercise 1 only.
    await page.locator('#timingChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#timingSelected'))
      .toContainText('toBeEnabled()');

    // Attempt to review the incomplete assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText(
        'Complete stage 2: Unstable product locator.'
      );

    // No assessment should be displayed.
    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // Exercise 2 should receive keyboard focus.
    await expect(page.locator('#locatorChoice'))
      .toBeFocused();

    // Exercise 1 must remain selected.
    await expect(page.locator('#timingChoice'))
      .toHaveValue('correct');

    // Module 5 should not write to My Progress yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('restores the selected debugging fix after refresh', async ({ page }) => {
    await page.goto('/automation-lab/module-5/');

    // Select the correct fix for the timing issue.
    await page.locator('#timingChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#timingSelected'))
      .toContainText('toBeEnabled()');

    await expect(page.locator('#codePreview'))
      .toContainText('toBeEnabled()');

    // Refresh the page.
    await page.reload();

    // Verify the learner's selected fix was restored.
    await expect(page.locator('#timingChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    await expect(page.locator('#timingSelected'))
      .toContainText('toBeEnabled()');

    await expect(page.locator('#codePreview'))
      .toContainText('toBeEnabled()');

    // Draft persistence must not create a My Progress session.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('scores an unreliable fixed wait at 80/100', async ({ page }) => {
    await page.goto('/automation-lab/module-5/');

    // One incorrect fix and three correct answers.
    await page.locator('#timingChoice').selectOption('wrong1');
    await page.locator('#locatorChoice').selectOption('correct');
    await page.locator('#asyncChoice').selectOption('correct');
    await page.locator('#isolationChoice').selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    // Review the assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#reviewResult'))
      .toBeVisible();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    // Verify the individual exercise scores.
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

    // The incorrect answer must receive useful feedback.
    await expect(feedback.nth(0))
      .toContainText('Needs revision');

    await expect(feedback.nth(0))
      .toContainText('fixed guess');

    // Verify that no real Playwright execution is claimed.
    await expect(page.locator('#reviewMessage'))
      .toContainText('simulated assessment');

    // Module 5 must not write to My Progress yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    const sessions = JSON.parse(progress ?? '[]');

    expect(sessions).toHaveLength(1);

    expect(sessions[0]).toMatchObject({
      id: 'automation-m5-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 25, 30]
    });

    // Reviewing unchanged answers must not create a duplicate.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText('already saved in My Progress');

    const repeated = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(repeated).toBe(progress);
  });


  test('updates the score from 80 to 100 after fixing timing', async ({ page }) => {
    await page.goto('/automation-lab/module-5/');

    // Begin with an unreliable fixed wait.
    await page.locator('#timingChoice').selectOption('wrong1');
    await page.locator('#locatorChoice').selectOption('correct');
    await page.locator('#asyncChoice').selectOption('correct');
    await page.locator('#isolationChoice').selectOption('correct');

    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    // Correct Exercise 1.
    await page.locator('#timingChoice')
      .selectOption('correct');

    // Old assessment feedback must disappear.
    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // Verify the TypeScript preview contains the new assertion.
    await expect(page.locator('#codePreview'))
      .toContainText(
        "await expect(page.getByRole('button', { name: 'Pay now' })).toBeEnabled();"
      );

    // Review the corrected assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#reviewResult'))
      .toBeVisible();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // Verify full marks for every exercise.
    const feedback = page.locator('#feedbackList .feedback-item');

    await expect(feedback).toHaveCount(4);

    await expect(feedback.nth(0)).toContainText('20/20 points');
    await expect(feedback.nth(1)).toContainText('25/25 points');
    await expect(feedback.nth(2)).toContainText('25/25 points');
    await expect(feedback.nth(3)).toContainText('30/30 points');

    // Refresh and verify that all corrected answers persist.
    await page.reload();

    await expect(page.locator('#timingChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#locatorChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#asyncChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#isolationChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    // Review the restored answers.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // My Progress integration is not enabled yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    const sessions = JSON.parse(progress ?? '[]');

    expect(sessions).toHaveLength(2);

    expect(sessions[0]).toMatchObject({
      id: 'automation-m5-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      questionScores: [20, 25, 25, 30]
    });

    expect(sessions[1]).toMatchObject({
      id: 'automation-m5-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 25, 30]
    });
  });

});
