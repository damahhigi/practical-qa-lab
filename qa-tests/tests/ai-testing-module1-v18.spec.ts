import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const LAB_URL = '/ai-testing-lab/';

// Reference outcomes are drawn from the six fictional Module 1 cases.
// These are practice fixtures, not assessments of a live AI model.
const referenceCases = [
  { id: 'AI-01', finding: 'pass', severity: 'none', points: 15 },
  { id: 'AI-02', finding: 'factual-error', severity: 'medium', points: 20 },
  { id: 'AI-03', finding: 'privacy', severity: 'critical', points: 20 },
  { id: 'AI-04', finding: 'prompt-injection', severity: 'high', points: 15 },
  { id: 'AI-05', finding: 'action-claim', severity: 'high', points: 15 },
  { id: 'AI-06', finding: 'fairness', severity: 'high', points: 15 },
] as const;

async function completeAssessment(page: Page) {
  for (const item of referenceCases) {
    await page.locator(`#${item.id}-finding`).selectOption(item.finding);
    await page.locator(`#${item.id}-severity`).selectOption(item.severity);
  }
}

async function snapshotStorage(page: Page) {
  return page.evaluate(() =>
    Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])
  );
}

test.describe('v1.8 AI Testing Lab — Module 1', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LAB_URL);
  });

  test('loads all six scenarios, accessible fields and the correct lab name', async ({ page }) => {
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI Review');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#results')).toBeHidden();

    for (const item of referenceCases) {
      const card = page.locator(`article.case[data-case-id="${item.id}"]`);
      await expect(card).toBeVisible();
      await expect(card.getByText('Trusted requirement / investigation evidence')).toBeVisible();
      await expect(card.getByText('AI response to investigate')).toBeVisible();
      await expect(page.locator(`#${item.id}-finding`)).toHaveAttribute('required', '');
      await expect(page.locator(`#${item.id}-severity`)).toHaveAttribute('required', '');
      await expect(page.locator(`#${item.id}-notes`)).toBeVisible();
    }

    expect(referenceCases.reduce((sum, item) => sum + item.points, 0)).toBe(100);
  });

  test('requires a finding and severity for every case before reviewing', async ({ page }) => {
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Complete both assessment fields for AI-01');
    await expect(page.locator('#AI-01-finding')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();

    await page.locator('#AI-01-finding').selectOption('pass');
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await page.locator('#AI-01-severity').selectOption('none');
    await expect(page.locator('#completedCount')).toHaveText('1/6');

    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('AI-02');
    await expect(page.locator('#AI-02-finding')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();
  });

  test('awards 100/100 for all six reference outcomes and shows individual feedback', async ({ page }) => {
    await completeAssessment(page);
    await expect(page.locator('#completedCount')).toHaveText('6/6');
    await page.locator('#reviewButton').click();

    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#feedbackList article.feedback')).toHaveCount(6);
    await expect(page.locator('#feedbackList .mark.full')).toHaveCount(6);
    await expect(page.locator('#resultIntro')).toContainText('6 guided AI testing scenarios');
    await expect(page.locator('#downloadButton')).toBeEnabled();
  });

  test('deducts only the incorrect classification portion of a case', async ({ page }) => {
    await completeAssessment(page);
    // AI-01 is worth 15 points: 11 for its finding, 4 for severity.
    await page.locator('#AI-01-finding').selectOption('privacy');
    await page.locator('#reviewButton').click();

    await expect(page.locator('#resultScore')).toHaveText('89/100');
    await expect(page.locator('#feedbackList article.feedback').first()).toContainText('4/15 points');
    await expect(page.locator('#feedbackList .mark.full')).toHaveCount(5);
    await expect(page.locator('#feedbackList article.feedback').first())
      .toContainText('Pass — meets the requirement');
  });

  test('invalidates previous feedback after a change and allows re-review', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');

    await page.locator('#AI-01-finding').selectOption('privacy');
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#formStatus')).toContainText('Your selections changed');

    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#resultScore')).toHaveText('89/100');
  });

  test('clear selections resets form fields, count and review state', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();

    await page.locator('#resetButton').click();
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#AI-01-finding')).toHaveValue('');
    await expect(page.locator('#AI-06-severity')).toHaveValue('');
    await expect(page.locator('#AI-01-finding')).toBeFocused();
    await expect(page.locator('#formStatus')).toContainText('Selections cleared');
  });

  test('downloads all findings and rationale without modifying browser storage', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('ai-lab-test-sentinel', 'keep-me'));
    await completeAssessment(page);
    const rationale = 'The simulated assistant shared a fictional account phone number without verification.';
    await page.locator('#AI-03-notes').fill(rationale);
    await page.locator('#reviewButton').click();
    const before = await snapshotStorage(page);

    const event = page.waitForEvent('download');
    await page.locator('#downloadButton').click();
    const download = await event;
    expect(download.suggestedFilename()).toBe('ai-testing-practice-findings.txt');
    const path = await download.path();
    expect(path).not.toBeNull();
    const content = await readFile(path!, 'utf8');

    expect(content).toContain('PRACTICAL QA LAB — AI TESTING PRACTICE ASSESSMENT');
    expect(content).toContain('Fictional guided simulation');
    expect(content).toContain('not a test of a live model');
    expect(content).toContain('Assessment score: 100/100');
    expect(content).toContain('AI-01');
    expect(content).toContain('AI-06');
    expect(content).toContain('Learner finding:');
    expect(content).toContain('Learner severity:');
    expect(content).toContain(`Evidence / rationale: ${rationale}`);
    expect(content).toContain('Reference severity:');
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('does not persist assessment answers and preserves unrelated localStorage', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('qa-existing-progress-test', 'untouched'));
    const before = await snapshotStorage(page);
    await completeAssessment(page);
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    expect(await snapshotStorage(page)).toEqual(before);

    await page.reload();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#AI-01-finding')).toHaveValue('');
    await expect(page.locator('#results')).toBeHidden();
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('keeps the investigation usable at a mobile viewport with keyboard navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#practiceTitle')).toBeVisible();
    await expect(page.locator('#caseList article.case')).toHaveCount(6);

    const widths = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(widths.page).toBeLessThanOrEqual(widths.viewport + 2);

    await page.locator('#AI-01-finding').focus();
    await expect(page.locator('#AI-01-finding')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#AI-01-severity')).toBeFocused();
    await page.locator('#AI-01-finding').selectOption('pass');
    await page.locator('#AI-01-severity').selectOption('none');
    await expect(page.locator('#completedCount')).toHaveText('1/6');
  });
});
