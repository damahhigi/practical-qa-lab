import { test, expect } from '@playwright/test';

test.describe('Test Automation Lab - Module 1', () => {

  test('loads the automation lab and four exercises', async ({ page }) => {
    await page.goto('/automation-lab/');

    await expect(page).toHaveTitle(
      /Test Automation Lab/
    );

    await expect(page.getByRole('heading', {
      name: 'Build your first Playwright test.'
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

  test('prevents reviewing an incomplete test', async ({ page }) => {
    await page.goto('/automation-lab/');

    await page.locator('#importsChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await page.locator('#reviewButton').click();

    await expect(page.locator('#formStatus'))
      .toContainText('Complete stage 2: Test declaration.');

    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    await expect(page.locator('#declarationChoice'))
      .toBeFocused();

    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('restores the selected statement after refresh', async ({ page }) => {
    await page.goto('/automation-lab/');

    // Select the correct Playwright import.
    await page.locator('#importsChoice').selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#codePreview'))
      .toContainText("import { test, expect } from '@playwright/test';");

    // Reload and verify browser-local draft persistence.
    await page.reload();

    await expect(page.locator('#importsChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');

    await expect(page.locator('#codePreview'))
      .toContainText("import { test, expect } from '@playwright/test';");

    // A saved draft must not create a completed progress session.
    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('scores an incorrect test declaration at 80/100', async ({ page }) => {
    await page.goto('/automation-lab/');

    // Three correct statements and one incorrect declaration.
    await page.locator('#importsChoice').selectOption('correct');
    await page.locator('#declarationChoice').selectOption('wrong1');
    await page.locator('#navigationChoice').selectOption('correct');
    await page.locator('#assertionChoice').selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    await page.locator('#reviewButton').click();

    await expect(page.locator('#reviewResult')).toBeVisible();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    const feedback = page.locator('#feedbackList .feedback-item');

    await expect(feedback).toHaveCount(4);

    await expect(feedback.nth(0)).toContainText('20/20 points');
    await expect(feedback.nth(1)).toContainText('0/20 points');
    await expect(feedback.nth(2)).toContainText('25/25 points');
    await expect(feedback.nth(3)).toContainText('35/35 points');

    await expect(feedback.nth(1))
      .toContainText('Needs revision');

    // Verify the completed assessment is saved.
    // The 80/100 attempt must be saved exactly once.
    const progress = await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem('practicalQaLab.progress.v1') || '[]'
      )
    );

    expect(progress).toHaveLength(1);
    expect(progress[0]).toMatchObject({
      id: 'automation-m1-c1cc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [20, 0, 25, 35]
    });

    // Repeating the same review must not add another session.
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


  test('updates the score from 80 to 100 after correcting an answer', async ({ page }) => {
    await page.goto('/automation-lab/');

    // Initially submit three correct answers and one incorrect answer.
    await page.locator('#importsChoice').selectOption('correct');
    await page.locator('#declarationChoice').selectOption('wrong1');
    await page.locator('#navigationChoice').selectOption('correct');
    await page.locator('#assertionChoice').selectOption('correct');

    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('80/100');

    // Correct the test declaration.
    await page.locator('#declarationChoice')
      .selectOption('correct');

    // Feedback for the previous submission must be hidden.
    await expect(page.locator('#reviewResult'))
      .toBeHidden();

    // Submit the corrected assessment.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#reviewResult'))
      .toBeVisible();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // Verify all four exercises receive full marks.
    const feedback = page.locator('#feedbackList .feedback-item');

    await expect(feedback).toHaveCount(4);

    await expect(feedback.nth(0)).toContainText('20/20 points');
    await expect(feedback.nth(1)).toContainText('20/20 points');
    await expect(feedback.nth(2)).toContainText('25/25 points');
    await expect(feedback.nth(3)).toContainText('35/35 points');

    // Refresh to verify corrected answers were saved.
    await page.reload();

    await expect(page.locator('#declarationChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('4/4');

    // Reviewing the restored draft must still score 100.
    await page.locator('#reviewButton').click();

    await expect(page.locator('#totalScore'))
      .toHaveText('100/100');

    // Verify corrected and original attempts are preserved.
    // Both the original 80/100 attempt and corrected
    // 100/100 attempt should be preserved.
    const progress = await page.evaluate(() =>
      JSON.parse(
        localStorage.getItem('practicalQaLab.progress.v1') || '[]'
      )
    );

    expect(progress).toHaveLength(2);

    expect(progress[0]).toMatchObject({
      id: 'automation-m1-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      questionScores: [20, 20, 25, 35]
    });

    expect(progress[1]).toMatchObject({
      id: 'automation-m1-c1cc',
      type: 'practice',
      area: 'automation',
      score: 80,
      maxScore: 100,
      questionScores: [20, 0, 25, 35]
    });

    await expect(page.locator('#formStatus'))
      .toContainText('already saved in My Progress');
  });

});
