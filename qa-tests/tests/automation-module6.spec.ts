import { test, expect } from '@playwright/test';

test.describe('Test Automation Lab - Module 6', () => {

  test('loads Module 6 and all four API exercises', async ({ page }) => {
    await page.goto('/automation-lab/module-6/');

    await expect(page).toHaveTitle(
      /API Automation/
    );

    await expect(page.locator('#page-title'))
      .toHaveText('Test the API behind the screen.');

    await expect(page.locator('#constructionForm fieldset'))
      .toHaveCount(4);

    await expect(page.locator('#completedCount'))
      .toHaveText('0/4');

    await expect(page.locator('#codePreview'))
      .toBeVisible();

    await expect(page.locator('#reviewButton'))
      .toBeVisible();

    // Verify all four API exercises exist.
    await expect(page.locator('#requestChoice'))
      .toBeVisible();

    await expect(page.locator('#statusChoice'))
      .toBeVisible();

    await expect(page.locator('#bodyChoice'))
      .toBeVisible();

    await expect(page.locator('#negativeChoice'))
      .toBeVisible();
  });

  test('prevents reviewing incomplete API exercises', async ({ page }) => {
    await page.goto('/automation-lab/module-6/');

    // Complete only Exercise 1.
    await page.locator('#requestChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#requestSelected'))
      .toContainText("await request.get('/api/products/42')");

    // Attempt to review an incomplete assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText(
        'Complete stage 2: Successful HTTP status.'
      );

    // No assessment score should be displayed.
    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // Exercise 2 should receive keyboard focus.
    await expect(page.locator('#statusChoice'))
      .toBeFocused();

    // Exercise 1 must remain selected.
    await expect(page.locator('#requestChoice'))
      .toHaveValue('correct');

    // Module 6 must not write to My Progress yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('restores the selected API request after refresh', async ({ page }) => {
    await page.goto('/automation-lab/module-6/');

    // Select the correct HTTP GET request.
    await page.locator('#requestChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#requestSelected'))
      .toContainText("await request.get('/api/products/42')");

    await expect(page.locator('#codePreview'))
      .toContainText("await request.get('/api/products/42')");

    // Refresh the browser page.
    await page.reload();

    // Verify that the selected answer was restored.
    await expect(page.locator('#requestChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    await expect(page.locator('#requestSelected'))
      .toContainText("await request.get('/api/products/42')");

    await expect(page.locator('#codePreview'))
      .toContainText("await request.get('/api/products/42')");

    // Draft persistence must not create a My Progress session.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('scores a missing await API request at 80/100', async ({ page }) => {
    await page.goto('/automation-lab/module-6/');

    // Select one incorrect statement and three correct statements.
    await page.locator('#requestChoice').selectOption('wrong1');
    await page.locator('#statusChoice').selectOption('correct');
    await page.locator('#bodyChoice').selectOption('correct');
    await page.locator('#negativeChoice').selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    // Submit the assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#reviewResult'))
      .toBeVisible();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    // Verify scores for all four exercises.
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

    // Verify that the incorrect API request receives feedback.
    await expect(feedback.nth(0))
      .toContainText('Needs revision');

    // Confirm this is a simulated assessment.
    await expect(page.locator('#reviewMessage'))
      .toContainText('simulated assessment');

    // My Progress integration is not enabled yet.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    const sessions = JSON.parse(progress ?? '[]');

    expect(sessions).toHaveLength(1);

    expect(sessions[0]).toMatchObject({
      id: 'automation-m6-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 25, 30]
    });

    // Identical reviews must not create duplicate sessions.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText('already saved in My Progress');

    const repeated = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(repeated).toBe(progress);
  });


  test('updates the score from 80 to 100 after correcting an API request', async ({ page }) => {
    await page.goto('/automation-lab/module-6/');

    // Start with an incorrect request missing await.
    await page.locator('#requestChoice').selectOption('wrong1');
    await page.locator('#statusChoice').selectOption('correct');
    await page.locator('#bodyChoice').selectOption('correct');
    await page.locator('#negativeChoice').selectOption('correct');

    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    // Correct Exercise 1.
    await page.locator('#requestChoice')
      .selectOption('correct');

    // Outdated assessment feedback must disappear.
    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // The generated code must contain the awaited request.
    await expect(page.locator('#codePreview'))
      .toContainText(
        "const response = await request.get('/api/products/42');"
      );

    // Review the corrected assessment.
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

    // Refresh and verify all corrected answers persist.
    await page.reload();

    await expect(page.locator('#requestChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#statusChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#bodyChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#negativeChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    // The restored assessment must still award full marks.
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
      id: 'automation-m6-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      questionScores: [20, 25, 25, 30]
    });

    expect(sessions[1]).toMatchObject({
      id: 'automation-m6-1ccc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [0, 25, 25, 30]
    });
  });

});
