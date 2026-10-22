import { test, expect } from '@playwright/test';

test.describe('Test Automation Lab - Module 4', () => {

  test('loads Module 4 and all four negative-testing exercises', async ({ page }) => {
    await page.goto('/automation-lab/module-4/');

    await expect(page).toHaveTitle(
      /Negative & Boundary Testing/
    );

    await expect(page.locator('#page-title'))
      .toHaveText('Test what should not be accepted.');

    await expect(page.locator('#constructionForm fieldset'))
      .toHaveCount(4);

    await expect(page.locator('#completedCount'))
      .toHaveText('0/4');

    await expect(page.locator('#codePreview'))
      .toBeVisible();

    await expect(page.locator('#reviewButton'))
      .toBeVisible();

    await expect(page.locator('#nameChoice'))
      .toBeVisible();

    await expect(page.locator('#emailChoice'))
      .toBeVisible();

    await expect(page.locator('#minChoice'))
      .toBeVisible();

    await expect(page.locator('#maxChoice'))
      .toBeVisible();
  });

  test('prevents reviewing incomplete negative tests', async ({ page }) => {
    await page.goto('/automation-lab/module-4/');

    // Complete Exercise 1 only.
    await page.locator('#nameChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#nameSelected'))
      .toContainText('Full name is required');

    // Attempt to review the incomplete assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText('Complete stage 2: Invalid email format.');

    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // Exercise 2 should receive focus.
    await expect(page.locator('#emailChoice'))
      .toBeFocused();

    // The first selection must remain saved.
    await expect(page.locator('#nameChoice'))
      .toHaveValue('correct');

    // Module 4 must not write to My Progress yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('restores the selected negative test after refresh', async ({ page }) => {
    await page.goto('/automation-lab/module-4/');

    // Select the correct required-name validation assertion.
    await page.locator('#nameChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#nameSelected'))
      .toContainText('Full name is required');

    await expect(page.locator('#codePreview'))
      .toContainText('Full name is required');

    // Refresh the page to test browser-local draft persistence.
    await page.reload();

    // Verify the answer and code preview are restored.
    await expect(page.locator('#nameChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    await expect(page.locator('#nameSelected'))
      .toContainText('Full name is required');

    await expect(page.locator('#codePreview'))
      .toContainText('Full name is required');

    // A saved draft must not create a My Progress session.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('scores an incorrect name validation at 80/100', async ({ page }) => {
    await page.goto('/automation-lab/module-4/');

    // One incorrect answer and three correct answers.
    await page.locator('#nameChoice').selectOption('wrong1');
    await page.locator('#emailChoice').selectOption('correct');
    await page.locator('#minChoice').selectOption('correct');
    await page.locator('#maxChoice').selectOption('correct');

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
      .toContainText('25/25 points');

    await expect(feedback.nth(3))
      .toContainText('30/30 points');

    // Confirm incorrect validation receives useful feedback.
    await expect(feedback.nth(0))
      .toContainText('Needs revision');

    // Confirm the review does not claim to execute Playwright.
    await expect(page.locator('#reviewMessage'))
      .toContainText('simulated assessment');

    // My Progress integration is not enabled yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    const sessions = JSON.parse(progress ?? '[]');

    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      id: 'automation-m4-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 25, 30]
    });

    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText('already saved in My Progress');

    const repeated = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(repeated).toBe(progress);
  });


  test('updates the score from 80 to 100 after correcting validation', async ({ page }) => {
    await page.goto('/automation-lab/module-4/');

    // Begin with one incorrect validation assertion.
    await page.locator('#nameChoice').selectOption('wrong1');
    await page.locator('#emailChoice').selectOption('correct');
    await page.locator('#minChoice').selectOption('correct');
    await page.locator('#maxChoice').selectOption('correct');

    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    // Correct Exercise 1.
    await page.locator('#nameChoice')
      .selectOption('correct');

    // Previous assessment feedback must disappear.
    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // The TypeScript preview must display the corrected assertion.
    await expect(page.locator('#codePreview'))
      .toContainText(
        "await expect(page.getByRole('alert')).toHaveText('Full name is required');"
      );

    // Submit the corrected assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#reviewResult'))
      .toBeVisible();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // Verify full marks for all four exercises.
    const feedback = page.locator('#feedbackList .feedback-item');

    await expect(feedback).toHaveCount(4);

    await expect(feedback.nth(0)).toContainText('20/20 points');
    await expect(feedback.nth(1)).toContainText('25/25 points');
    await expect(feedback.nth(2)).toContainText('25/25 points');
    await expect(feedback.nth(3)).toContainText('30/30 points');

    // Refresh and verify all four answers remain saved.
    await page.reload();

    await expect(page.locator('#nameChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#emailChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#minChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#maxChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    // Review the restored assessment again.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // Module 4 must not write to My Progress yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    const sessions = JSON.parse(progress ?? '[]');

    expect(sessions).toHaveLength(2);

    expect(sessions[0]).toMatchObject({
      id: 'automation-m4-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      questionScores: [20, 25, 25, 30]
    });

    expect(sessions[1]).toMatchObject({
      id: 'automation-m4-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 25, 30]
    });
  });

});
