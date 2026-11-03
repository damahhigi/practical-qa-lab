import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const MODULE_URL = '/ai-testing-lab/module-6/';

// These are fixed, fictional training fixtures. This suite is not a live-model audit.
const referenceCases = [
  { id: 'EVAL-01', finding: 'pass', decision: 'approve', severity: 'none', metric: '96', weight: 15 },
  { id: 'EVAL-02', finding: 'groundedness-regression', decision: 'block', severity: 'high', metric: '86', weight: 20 },
  { id: 'EVAL-03', finding: 'safety-recall-gate', decision: 'block', severity: 'high', metric: '90', weight: 20 },
  { id: 'EVAL-04', finding: 'subgroup-quality-gate', decision: 'block', severity: 'high', metric: '79', weight: 15 },
  { id: 'EVAL-05', finding: 'reviewer-agreement', decision: 'investigate', severity: 'medium', metric: '75', weight: 15 },
  { id: 'EVAL-06', finding: 'critical-safety-gate', decision: 'block', severity: 'critical', metric: '1', weight: 15 },
] as const;

async function completeAssessment(page: Page) {
  for (const item of referenceCases) {
    await page.locator(`#${item.id}-finding`).selectOption(item.finding);
    await page.locator(`#${item.id}-decision`).selectOption(item.decision);
    await page.locator(`#${item.id}-severity`).selectOption(item.severity);
    await page.locator(`#${item.id}-metric`).fill(item.metric);
  }
}

async function snapshotStorage(page: Page) {
  return page.evaluate(() => ({
    local: Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]),
    session: Object.keys(sessionStorage).sort().map(key => [key, sessionStorage.getItem(key)]),
  }));
}

test.describe('v1.8 AI Testing — Module 6: evaluation datasets and metrics', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(MODULE_URL);
  });

  test('renders six accessible metric cases with weights totaling 100', async ({ page }) => {
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI — Release Quality Review');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#results')).toBeHidden();

    const total = referenceCases.reduce((sum, item) => sum + item.weight, 0);
    expect(total).toBe(100);
    for (const item of referenceCases) {
      const card = page.locator(`[data-case-id="${item.id}"]`);
      await expect(card.locator('.points')).toHaveText(`${item.weight} points`);
      await expect(card.locator('.security-panel.rule')).toBeVisible();
      await expect(card.locator('.trace-panel')).toBeVisible();
      for (const field of ['finding', 'decision', 'severity', 'metric']) {
        await expect(page.locator(`#${item.id}-${field}`)).toBeVisible();
        await expect(page.locator(`label[for="${item.id}-${field}"]`)).toBeVisible();
      }
      await expect(page.locator(`#${item.id}-metric`)).toHaveAttribute('type', 'number');
      await expect(page.locator(`#${item.id}-metric`)).toHaveAttribute('min', '0');
      await expect(page.locator(`#${item.id}-metric`)).toHaveAttribute('max', '100');
    }
    await expect(page.locator('.note-callout')).toContainText('invented datasets');
  });

  test('shows dataset, regression, recall, subgroup, agreement and privacy evidence', async ({ page }) => {
    await expect(page.locator('[data-case-id="EVAL-01"]')).toContainText('192');
    await expect(page.locator('[data-case-id="EVAL-01"]')).toContainText('held-out');
    await expect(page.locator('[data-case-id="EVAL-02"]')).toContainText('86%');
    await expect(page.locator('[data-case-id="EVAL-02"]')).toContainText('94%');
    await expect(page.locator('[data-case-id="EVAL-03"]')).toContainText('False negatives');
    await expect(page.locator('[data-case-id="EVAL-03"]')).toContainText('72');
    await expect(page.locator('[data-case-id="EVAL-04"]')).toContainText('Kiswahili');
    await expect(page.locator('[data-case-id="EVAL-05"]')).toContainText('Cohen');
    await expect(page.locator('[data-case-id="EVAL-06"]')).toContainText('zero');
    await expect(page.locator('.method-note')).toContainText('recall = TP / (TP + FN)');
  });

  test('requires each decision field and a valid percentage before review', async ({ page }) => {
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('finding for EVAL-01');
    await expect(page.locator('#EVAL-01-finding')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();

    await page.locator('#EVAL-01-finding').selectOption('pass');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('decision for EVAL-01');
    await expect(page.locator('#EVAL-01-decision')).toBeFocused();

    await page.locator('#EVAL-01-decision').selectOption('approve');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('severity for EVAL-01');
    await expect(page.locator('#EVAL-01-severity')).toBeFocused();

    await page.locator('#EVAL-01-severity').selectOption('none');
    await page.locator('#EVAL-01-metric').fill('101');
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('percentage (0–100) for EVAL-01');
    await expect(page.locator('#EVAL-01-metric')).toBeFocused();

    await page.locator('#EVAL-01-metric').fill('96');
    await expect(page.locator('#completedCount')).toHaveText('1/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('EVAL-02');
    await expect(page.locator('#EVAL-02-finding')).toBeFocused();
  });

  test('awards 100/100 to the reference answers with metric formulas and feedback', async ({ page }) => {
    await completeAssessment(page);
    await expect(page.locator('#completedCount')).toHaveText('6/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#feedbackList article.feedback')).toHaveCount(6);
    await expect(page.locator('#feedbackList .mark.full')).toHaveCount(6);
    await expect(page.locator('#resultIntro')).toContainText('6 fictional AI release-quality scenarios');
    await expect(page.locator('#feedbackList article.feedback').nth(2))
      .toContainText('90%');
    await expect(page.locator('#feedbackList article.feedback').nth(4))
      .toContainText('0.50');
    await expect(page.locator('#feedbackList article.feedback').last())
      .toContainText('zero-critical-failures');
  });

  test('scores the numeric metric and release decision independently', async ({ page }) => {
    await completeAssessment(page);
    // EVAL-03 is worth 20: finding 9 + decision 4 + severity 3 + metric 4.
    await page.locator('#EVAL-03-metric').fill('93');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('96/100');
    await expect(page.locator('#feedbackList article.feedback').nth(2))
      .toContainText('16/20 points');

    await page.locator('#EVAL-03-decision').selectOption('approve');
    await expect(page.locator('#results')).toBeHidden();
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('92/100');
    await expect(page.locator('#feedbackList article.feedback').nth(2))
      .toContainText('12/20 points');

    await page.locator('#EVAL-03-metric').fill('90');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('96/100');
    await expect(page.locator('#feedbackList article.feedback').nth(2))
      .toContainText('16/20 points');
  });

  test('invalidates stale feedback after edits; notes are not automatically scored', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#EVAL-04-notes').fill('79/100 for Kiswahili; below the 85% gate.');
    await page.locator('#EVAL-04-retest').fill('Double-rate matched intents with qualified Kiswahili reviewers.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');

    await page.locator('#reviseButton').click();
    await expect(page.locator('#EVAL-01-finding')).toBeFocused();
    await page.locator('#EVAL-04-notes').fill('Updated notes: observed gap = 15 percentage points.');
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#formStatus')).toContainText('Answers changed');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#EVAL-04-notes'))
      .toHaveValue('Updated notes: observed gap = 15 percentage points.');
  });

  test('clears assessment choices, metrics, notes and previous feedback', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#EVAL-05-notes').fill('Observed agreement is 75%.');
    await page.locator('#EVAL-05-retest').fill('Adjudicate labels and rerun double-rating.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
    await page.locator('#resetButton').click();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#EVAL-01-finding')).toHaveValue('');
    await expect(page.locator('#EVAL-01-metric')).toHaveValue('');
    await expect(page.locator('#EVAL-06-severity')).toHaveValue('');
    await expect(page.locator('#EVAL-05-notes')).toHaveValue('');
    await expect(page.locator('#EVAL-05-retest')).toHaveValue('');
    await expect(page.locator('#EVAL-01-finding')).toBeFocused();
    await expect(page.locator('#formStatus')).toContainText('Selections cleared');
  });

  test('downloads a complete metrics report without changing browser storage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', '[{"id":"preserve-old-progress"}]');
      localStorage.setItem('m6-old-reports', 'leave-other-evidence-intact');
      sessionStorage.setItem('m6-session', 'existing-session');
    });
    await completeAssessment(page);
    const notes = '72 TP / (72 TP + 8 FN) = 90% recall; launch gate is 95%.';
    const retest = 'Review the eight false negatives and rerun held-out safety cases.';
    await page.locator('#EVAL-03-notes').fill(notes);
    await page.locator('#EVAL-03-retest').fill(retest);
    await page.locator('#reviewButton').click();
    const before = await snapshotStorage(page);

    const pending = page.waitForEvent('download');
    await page.locator('#downloadButton').click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('ai-testing-module6-metrics-findings.txt');
    const downloadedPath = await download.path();
    expect(downloadedPath).not.toBeNull();
    const report = await readFile(downloadedPath!, 'utf8');
    expect(report).toContain('PRACTICAL QA LAB — AI TESTING MODULE 6');
    expect(report).toContain('Not a live model evaluation');
    expect(report).toContain('Assessment score: 100/100');
    for (const item of referenceCases) expect(report).toContain(item.id);
    expect(report).toContain('Requested metric:');
    expect(report).toContain('Learner metric: 90%');
    expect(report).toContain(`Calculation and evidence notes: ${notes}`);
    expect(report).toContain(`Follow-up evaluation plan: ${retest}`);
    expect(report).toContain('Reference metric: 75%');
    expect(report).toContain('Reference explanation:');
    await expect(page.locator('#downloadStatus')).toContainText('download prepared');
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('never saves unfinished or completed module answers to existing progress', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', '[{"id":"previous-qa-session"}]');
      localStorage.setItem('qa-existing-bugs', 'preserve');
      sessionStorage.setItem('qa-session-existing', 'preserve');
    });
    const before = await snapshotStorage(page);
    await completeAssessment(page);
    await page.locator('#EVAL-06-notes').fill('Two critical disclosures violate the zero-failure gate.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    expect(await snapshotStorage(page)).toEqual(before);

    await page.reload();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#EVAL-01-finding')).toHaveValue('');
    await expect(page.locator('#EVAL-03-metric')).toHaveValue('');
    await expect(page.locator('#EVAL-06-notes')).toHaveValue('');
    await expect(page.locator('#results')).toBeHidden();
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('supports keyboard access, mobile widths and Module 5 back navigation', async ({ page }) => {
    await expect(page.locator('header nav a[href="../module-5/"]')).toBeVisible();
    await expect(page.locator('.next a[href="../module-5/"]')).toBeVisible();
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const dims = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dims.content).toBeLessThanOrEqual(dims.viewport + 2);
    }
    await page.locator('#EVAL-01-finding').focus();
    await expect(page.locator('#EVAL-01-finding')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#EVAL-01-decision')).toBeFocused();
  });
});
