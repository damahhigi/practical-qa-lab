import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const MODULE_URL = '/ai-testing-lab/module-2/';

// The six deterministic, fictional Module 2 reference fixtures.
// These scores do not represent real-world model accuracy or reliability.
const referenceCases = [
  { id: 'PR-01', finding: 'pass', severity: 'none', weight: 15 },
  { id: 'PR-02', finding: 'format', severity: 'low', weight: 15 },
  { id: 'PR-03', finding: 'accuracy', severity: 'medium', weight: 20 },
  { id: 'PR-04', finding: 'consistency', severity: 'high', weight: 20 },
  { id: 'PR-05', finding: 'clarification', severity: 'medium', weight: 15 },
  { id: 'PR-06', finding: 'grounding', severity: 'high', weight: 15 },
] as const;

async function completeAssessment(page: Page) {
  for (const scenario of referenceCases) {
    await page.locator(`#${scenario.id}-finding`).selectOption(scenario.finding);
    await page.locator(`#${scenario.id}-severity`).selectOption(scenario.severity);
  }
}

async function storageSnapshot(page: Page) {
  return page.evaluate(() =>
    Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)])
  );
}

test.describe('v1.8 AI Testing Lab — Module 2: Prompt & Response Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MODULE_URL);
  });

  test('renders six paired scenarios with readable requirements and accessible fields', async ({ page }) => {
    await expect(page.locator('#pageTitle')).toHaveText('Prompt & Response Testing');
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI — Prompt Review');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    await expect(page.locator('#caseList .pair')).toHaveCount(12);
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#results')).toBeHidden();

    for (const scenario of referenceCases) {
      const card = page.locator(`article.case[data-case-id="${scenario.id}"]`);
      await expect(card).toBeVisible();
      await expect(card.locator('.oracle')).toContainText('Trusted requirement');
      await expect(card.locator('.pair')).toHaveCount(2);
      await expect(card.getByText('User prompt')).toHaveCount(2);
      await expect(card.getByText('Simulated AI response')).toHaveCount(2);
      await expect(page.locator(`#${scenario.id}-finding`)).toHaveAttribute('required', '');
      await expect(page.locator(`#${scenario.id}-severity`)).toHaveAttribute('required', '');
      await expect(page.locator(`#${scenario.id}-notes`)).toHaveAttribute('maxlength', '1200');
      await expect(page.locator(`#${scenario.id}-retest`)).toHaveAttribute('maxlength', '1200');
    }

    expect(referenceCases.reduce((total, scenario) => total + scenario.weight, 0)).toBe(100);
  });

  test('requires finding and severity for every pair before review', async ({ page }) => {
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Complete both assessment fields for PR-01');
    await expect(page.locator('#PR-01-finding')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();

    await page.locator('#PR-01-finding').selectOption('pass');
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await page.locator('#PR-01-severity').selectOption('none');
    await expect(page.locator('#completedCount')).toHaveText('1/6');

    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('PR-02');
    await expect(page.locator('#PR-02-finding')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();
  });

  test('awards 100 points and shows reference feedback for all six pairs', async ({ page }) => {
    await completeAssessment(page);
    await expect(page.locator('#completedCount')).toHaveText('6/6');
    await page.locator('#reviewButton').click();

    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#feedbackList article.feedback')).toHaveCount(6);
    await expect(page.locator('#feedbackList .mark.full')).toHaveCount(6);
    await expect(page.locator('#resultIntro')).toContainText('6 guided prompt-and-response comparisons');
    await expect(page.locator('#downloadButton')).toBeEnabled();
  });

  test('scores classification and severity independently using the weighted rubric', async ({ page }) => {
    await completeAssessment(page);
    // PR-03 is worth 20 points: 14 for classification and 6 for severity.
    await page.locator('#PR-03-finding').selectOption('pass');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('86/100');
    await expect(page.locator('#feedbackList article.feedback').nth(2)).toContainText('6/20 points');

    // PR-04 loses its six severity points, but earns its 14 classification points.
    await page.locator('#PR-04-severity').selectOption('low');
    await expect(page.locator('#results')).toBeHidden();
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('80/100');
    await expect(page.locator('#feedbackList article.feedback').nth(3)).toContainText('14/20 points');
  });

  test('keeps written evidence unscored and invalidates stale feedback when revised', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#PR-06-notes').fill('The cited policy section is absent from the oracle.');
    await page.locator('#PR-06-retest').fill('Quote the exact Nakuru delivery source before making a promise.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');

    await page.locator('#PR-06-notes').fill('The guarantee and section 9.4 are unsupported.');
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#formStatus')).toContainText('Answers changed');

    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#PR-06-notes')).toHaveValue('The guarantee and section 9.4 are unsupported.');
  });

  test('clears selections, written evidence, feedback, and the progress counter', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#PR-01-notes').fill('Comparison evidence');
    await page.locator('#PR-01-retest').fill('Proposed follow-up prompt');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();

    await page.locator('#resetButton').click();
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#PR-01-finding')).toHaveValue('');
    await expect(page.locator('#PR-06-severity')).toHaveValue('');
    await expect(page.locator('#PR-01-notes')).toHaveValue('');
    await expect(page.locator('#PR-01-retest')).toHaveValue('');
    await expect(page.locator('#PR-01-finding')).toBeFocused();
    await expect(page.locator('#formStatus')).toContainText('Selections cleared');
  });

  test('downloads all six paired findings with learner evidence and preserves storage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', JSON.stringify([{ id: 'leave-this-alone' }]));
      localStorage.setItem('ai-module2-test-sentinel', 'keep-me');
    });
    await completeAssessment(page);
    const evidence = 'Response B invents an unsupported next-morning guarantee and policy citation.';
    const followUp = 'Show the exact approved shipping excerpt; identify any unsupported claim.';
    await page.locator('#PR-06-notes').fill(evidence);
    await page.locator('#PR-06-retest').fill(followUp);
    await page.locator('#reviewButton').click();
    const before = await storageSnapshot(page);

    const downloadEvent = page.waitForEvent('download');
    await page.locator('#downloadButton').click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe('ai-testing-module2-prompt-response-findings.txt');
    const filePath = await download.path();
    expect(filePath).not.toBeNull();
    const report = await readFile(filePath!, 'utf8');

    expect(report).toContain('PRACTICAL QA LAB — AI TESTING MODULE 2');
    expect(report).toContain('Fictional, prewritten simulation. Not a test of a live AI model.');
    expect(report).toContain('Assessment score: 100/100');
    for (const scenario of referenceCases) expect(report).toContain(scenario.id);
    expect(report).toContain('Variation A prompt:');
    expect(report).toContain('Variation A response:');
    expect(report).toContain('Variation B prompt:');
    expect(report).toContain('Variation B response:');
    expect(report).toContain(`Evidence: ${evidence}`);
    expect(report).toContain(`Follow-up test prompt: ${followUp}`);
    expect(report).toContain('Reference finding:');
    expect(report).toContain('Reference severity:');
    await expect(page.locator('#downloadStatus')).toContainText('download prepared');
    expect(await storageSnapshot(page)).toEqual(before);
  });

  test('does not persist learner answers or modify existing browser data', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('existing-browser-work', 'untouched'));
    const before = await storageSnapshot(page);
    await completeAssessment(page);
    await page.locator('#PR-05-notes').fill('This is private in-tab practice.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    expect(await storageSnapshot(page)).toEqual(before);

    await page.reload();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#PR-01-finding')).toHaveValue('');
    await expect(page.locator('#PR-05-notes')).toHaveValue('');
    await expect(page.locator('#results')).toBeHidden();
    expect(await storageSnapshot(page)).toEqual(before);
  });

  test('remains usable on a mobile viewport with keyboard navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#practiceTitle')).toBeVisible();
    await expect(page.locator('#caseList article.case')).toHaveCount(6);

    const dimensions = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 2);

    await page.locator('#PR-01-finding').focus();
    await expect(page.locator('#PR-01-finding')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#PR-01-severity')).toBeFocused();
    await page.locator('#PR-01-finding').selectOption('pass');
    await page.locator('#PR-01-severity').selectOption('none');
    await expect(page.locator('#completedCount')).toHaveText('1/6');
  });

  test('offers Module 1 navigation and clearly discloses its simulated nature', async ({ page }) => {
    await expect(page.locator('.brief')).toContainText('not a live AI evaluation');
    await expect(page.locator('.brief')).toContainText('does not save or upload your answers');
    await expect(page.locator('.method-note')).toContainText('does not estimate real-world failure rates');
    await expect(page.locator('nav[aria-label="AI Testing navigation"] a').first())
      .toHaveAttribute('href', '../');
    await expect(page.locator('nav[aria-label="AI Testing navigation"] a').last())
      .toHaveAttribute('href', '../../portfolio/');
    await page.locator('nav[aria-label="AI Testing navigation"] a').first().click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/?$/);
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI Review');
  });
});
