import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const MODULE_URL = '/ai-testing-lab/module-5/';

// Fictional, deterministic fixtures: these tests are not a live-model fairness audit.
const referenceCases = [
  { id: 'FAIR-01', finding: 'pass', boundary: 'equivalent', severity: 'none', weight: 15 },
  { id: 'FAIR-02', finding: 'language-inconsistency', boundary: 'unexplained', severity: 'medium', weight: 20 },
  { id: 'FAIR-03', finding: 'potential-disparity', boundary: 'unexplained', severity: 'high', weight: 20 },
  { id: 'FAIR-04', finding: 'justified-difference', boundary: 'justified', severity: 'none', weight: 15 },
  { id: 'FAIR-05', finding: 'accessibility-barrier', boundary: 'unexplained', severity: 'high', weight: 15 },
  { id: 'FAIR-06', finding: 'evaluation-gap', boundary: 'limited', severity: 'medium', weight: 15 },
] as const;

async function completeAssessment(page: Page) {
  for (const item of referenceCases) {
    await page.locator(`#${item.id}-finding`).selectOption(item.finding);
    await page.locator(`#${item.id}-boundary`).selectOption(item.boundary);
    await page.locator(`#${item.id}-severity`).selectOption(item.severity);
  }
}

async function snapshotStorage(page: Page) {
  return page.evaluate(() => ({
    local: Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]),
    session: Object.keys(sessionStorage).sort().map(key => [key, sessionStorage.getItem(key)]),
  }));
}

test.describe('v1.8 AI Testing Lab — Module 5: fairness and multilingual evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MODULE_URL);
  });

  test('renders six accessible cases with a 100-point rubric', async ({ page }) => {
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI — Fairness Review');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#results')).toBeHidden();
    for (const item of referenceCases) {
      const card = page.locator(`article.case[data-case-id="${item.id}"]`);
      await expect(card).toBeVisible();
      await expect(card.locator('.security-panel')).toHaveCount(2);
      await expect(card.locator('.trace-panel')).toContainText('Observed responses / evaluation evidence');
      await expect(card.locator('.points')).toContainText(`${item.weight} points`);
      for (const field of ['finding', 'boundary', 'severity']) {
        const select = page.locator(`#${item.id}-${field}`);
        await expect(select).toHaveAttribute('required', '');
        await expect(select).toHaveValue('');
        await expect(page.locator(`label[for="${item.id}-${field}"]`)).toHaveCount(1);
      }
      for (const field of ['notes', 'retest']) {
        await expect(page.locator(`#${item.id}-${field}`)).toHaveAttribute('maxlength', '1200');
      }
    }
    expect(referenceCases.reduce((total, item) => total + item.weight, 0)).toBe(100);
  });

  test('distinguishes equivalent, inconsistent, justified and limited comparisons', async ({ page }) => {
    await expect(page.locator('[data-case-id="FAIR-01"] .trace-panel'))
      .toContainText('Oda 204 ilitumwa saa 10:15');
    await expect(page.locator('[data-case-id="FAIR-02"] .trace-panel'))
      .toContainText('Current approved policy: 14 days');
    await expect(page.locator('[data-case-id="FAIR-03"] .security-panel.input'))
      .toContainText('Achieng');
    await expect(page.locator('[data-case-id="FAIR-04"] .trace-panel'))
      .toContainText('Zone 3 = KES 550');
    await expect(page.locator('[data-case-id="FAIR-05"] .trace-panel'))
      .toContainText('unlabeled image');
    await expect(page.locator('[data-case-id="FAIR-06"] .security-panel.input'))
      .toContainText('980 prompts');
    await expect(page.locator('[data-case-id="FAIR-06"] .trace-panel'))
      .toContainText('No confidence intervals');
    await expect(page.locator('.method-note')).toContainText('not proof of system-wide bias');
  });

  test('rejects incomplete assessments and focuses the missing field', async ({ page }) => {
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus'))
      .toContainText('Complete the finding selection for FAIR-01');
    await expect(page.locator('#FAIR-01-finding')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();

    await page.locator('#FAIR-01-finding').selectOption('pass');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus'))
      .toContainText('Complete the comparison verdict selection for FAIR-01');
    await expect(page.locator('#FAIR-01-boundary')).toBeFocused();

    await page.locator('#FAIR-01-boundary').selectOption('equivalent');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus'))
      .toContainText('Complete the severity selection for FAIR-01');
    await expect(page.locator('#FAIR-01-severity')).toBeFocused();

    await page.locator('#FAIR-01-severity').selectOption('none');
    await expect(page.locator('#completedCount')).toHaveText('1/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('FAIR-02');
    await expect(page.locator('#FAIR-02-finding')).toBeFocused();
  });

  test('scores six reference comparisons at 100/100 with clear limitations', async ({ page }) => {
    await completeAssessment(page);
    await expect(page.locator('#completedCount')).toHaveText('6/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#feedbackList article.feedback')).toHaveCount(6);
    await expect(page.locator('#feedbackList .mark.full')).toHaveCount(6);
    await expect(page.locator('#resultIntro')).toContainText('6 fictional AI fairness cases');
    await expect(page.locator('[data-case-id="FAIR-03"]')).toBeVisible();
    await expect(page.locator('#feedbackList article.feedback').nth(2))
      .toContainText('a single pair cannot prove');
    await expect(page.locator('#feedbackList article.feedback').last())
      .toContainText('unequal sample sizes');
  });

  test('scores finding, comparison verdict and severity independently', async ({ page }) => {
    await completeAssessment(page);
    // FAIR-02 has 20 points: finding 12, comparison 4, severity 4.
    await page.locator('#FAIR-02-finding').selectOption('pass');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('88/100');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('8/20 points');

    await page.locator('#FAIR-02-boundary').selectOption('justified');
    await expect(page.locator('#results')).toBeHidden();
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('84/100');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('4/20 points');

    await page.locator('#FAIR-02-severity').selectOption('none');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('80/100');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('0/20 points');
  });

  test('keeps written evidence unscored and hides stale feedback after edits', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#FAIR-02-notes').fill('Same return policy, but Kiswahili answer says seven days.');
    await page.locator('#FAIR-02-retest').fill('Repeat matched English and Kiswahili prompts for each policy version.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');

    await page.locator('#reviseButton').click();
    await expect(page.locator('#FAIR-01-finding')).toBeFocused();
    await page.locator('#FAIR-02-notes').fill('Updated evidence: identical eligibility, different language response.');
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#formStatus')).toContainText('Answers changed');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#FAIR-02-notes'))
      .toHaveValue('Updated evidence: identical eligibility, different language response.');
  });

  test('resets selections, notes and assessment feedback', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#FAIR-03-notes').fill('Same account tier, different escalation advice.');
    await page.locator('#FAIR-03-retest').fill('Run blinded name swaps with fixed account attributes.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
    await page.locator('#resetButton').click();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#FAIR-01-finding')).toHaveValue('');
    await expect(page.locator('#FAIR-01-boundary')).toHaveValue('');
    await expect(page.locator('#FAIR-06-severity')).toHaveValue('');
    await expect(page.locator('#FAIR-03-notes')).toHaveValue('');
    await expect(page.locator('#FAIR-03-retest')).toHaveValue('');
    await expect(page.locator('#FAIR-01-finding')).toBeFocused();
    await expect(page.locator('#formStatus')).toContainText('Selections cleared');
  });

  test('downloads the evidence report without changing browser storage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', '[{"id":"preserve-history"}]');
      localStorage.setItem('m5-other-lab', 'keep-other-work');
      sessionStorage.setItem('m5-sentinel', 'preserve-session');
    });
    await completeAssessment(page);
    const notes = 'Observed policy mismatch; cannot infer population-level bias from one pair.';
    const retest = 'Use 50 balanced prompt pairs per language and review per-language accuracy.';
    await page.locator('#FAIR-02-notes').fill(notes);
    await page.locator('#FAIR-02-retest').fill(retest);
    await page.locator('#reviewButton').click();
    const before = await snapshotStorage(page);

    const waiting = page.waitForEvent('download');
    await page.locator('#downloadButton').click();
    const download = await waiting;
    expect(download.suggestedFilename()).toBe('ai-testing-module5-fairness-findings.txt');
    const path = await download.path();
    expect(path).not.toBeNull();
    const report = await readFile(path!, 'utf8');
    expect(report).toContain('PRACTICAL QA LAB — AI TESTING MODULE 5');
    expect(report).toContain('Not a live-model fairness audit');
    expect(report).toContain('Assessment score: 100/100');
    for (const item of referenceCases) expect(report).toContain(item.id);
    expect(report).toContain('Approved behavior:');
    expect(report).toContain('Observed responses and evaluation evidence:');
    expect(report).toContain(`Evidence, controls and limitations: ${notes}`);
    expect(report).toContain(`Follow-up QA test: ${retest}`);
    expect(report).toContain('Reference explanation:');
    await expect(page.locator('#downloadStatus')).toContainText('download prepared');
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('does not persist unfinished answers or overwrite previous progress', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', '[{"id":"original-entry"}]');
      localStorage.setItem('m5-custom', 'unchanged');
      sessionStorage.setItem('m5-existing', 'untouched');
    });
    const before = await snapshotStorage(page);
    await completeAssessment(page);
    await page.locator('#FAIR-06-notes').fill('Unbalanced topics make the gap inconclusive.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    expect(await snapshotStorage(page)).toEqual(before);

    await page.reload();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#FAIR-01-finding')).toHaveValue('');
    await expect(page.locator('#FAIR-06-notes')).toHaveValue('');
    await expect(page.locator('#results')).toBeHidden();
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('supports keyboard navigation, mobile layout and previous-module link', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('header nav a[href="../module-4/"]')).toBeVisible();
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    await page.locator('#FAIR-01-finding').focus();
    await expect(page.locator('#FAIR-01-finding')).toBeFocused();
    await expect(page.locator('label[for="FAIR-01-finding"]'))
      .toContainText('Primary finding');
    await page.locator('#FAIR-01-finding').selectOption('pass');
    await page.keyboard.press('Tab');
    await expect(page.locator('#FAIR-01-boundary')).toBeFocused();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 2);
  });
});
