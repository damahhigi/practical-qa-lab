import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const LAB_URL = '/ai-testing-lab/module-4/';

// These are fictional deterministic fixtures, not live security testing.
const referenceCases = [
  { id: 'SAFE-01', finding: 'pass', boundary: 'respected', severity: 'none', weight: 15 },
  { id: 'SAFE-02', finding: 'indirect-injection', boundary: 'crossed', severity: 'high', weight: 20 },
  { id: 'SAFE-03', finding: 'privacy-disclosure', boundary: 'crossed', severity: 'critical', weight: 20 },
  { id: 'SAFE-04', finding: 'unauthorized-action', boundary: 'crossed', severity: 'high', weight: 15 },
  { id: 'SAFE-05', finding: 'pass', boundary: 'respected', severity: 'none', weight: 15 },
  { id: 'SAFE-06', finding: 'unsafe-output', boundary: 'crossed', severity: 'high', weight: 15 },
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

test.describe('v1.8 AI Testing Lab — Module 4: security and privacy evaluations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LAB_URL);
  });

  test('renders six accessible security cases totaling 100 points', async ({ page }) => {
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI — Trust Boundary Review');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#results')).toBeHidden();
    for (const item of referenceCases) {
      const card = page.locator(`article.case[data-case-id="${item.id}"]`);
      await expect(card).toBeVisible();
      await expect(card.locator('.security-panel')).toHaveCount(2);
      await expect(card.locator('.trace-panel')).toContainText('Observed response and system trace');
      await expect(card.locator('.points')).toContainText(`${item.weight} points`);
      for (const field of ['finding', 'boundary', 'severity']) {
        await expect(page.locator(`#${item.id}-${field}`)).toHaveAttribute('required', '');
        await expect(page.locator(`#${item.id}-${field}`)).toHaveValue('');
      }
      for (const field of ['notes', 'retest']) {
        await expect(page.locator(`#${item.id}-${field}`)).toHaveAttribute('maxlength', '1200');
      }
    }
    expect(referenceCases.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });

  test('distinguishes blocked attacks, confirmed failures and inert HTML fixture text', async ({ page }) => {
    await expect(page.locator('[data-case-id="SAFE-01"] .trace-panel'))
      .toContainText('No restricted data lookup attempted');
    await expect(page.locator('[data-case-id="SAFE-05"] .trace-panel'))
      .toContainText('No email or outbound transfer tool was invoked');
    await expect(page.locator('[data-case-id="SAFE-02"] .security-panel.input'))
      .toContainText('ignore the rule above');
    await expect(page.locator('[data-case-id="SAFE-03"] .trace-panel'))
      .toContainText('U-202 records');
    await expect(page.locator('[data-case-id="SAFE-04"] .trace-panel'))
      .toContainText('subscription.cancel(account=U-101) executed');
    const outputCase = page.locator('[data-case-id="SAFE-06"]');
    await expect(outputCase.locator('.security-panel.input')).toContainText('<a href=');
    await expect(outputCase.locator('.security-panel.input a')).toHaveCount(0);
    await expect(outputCase.locator('.trace-panel')).toContainText('innerHTML');
  });

  test('rejects incomplete assessments and focuses the first missing field', async ({ page }) => {
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Complete the finding selection for SAFE-01');
    await expect(page.locator('#SAFE-01-finding')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();

    await page.locator('#SAFE-01-finding').selectOption('pass');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Complete the boundary selection for SAFE-01');
    await expect(page.locator('#SAFE-01-boundary')).toBeFocused();

    await page.locator('#SAFE-01-boundary').selectOption('respected');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Complete the severity selection for SAFE-01');
    await expect(page.locator('#SAFE-01-severity')).toBeFocused();

    await page.locator('#SAFE-01-severity').selectOption('none');
    await expect(page.locator('#completedCount')).toHaveText('1/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('SAFE-02');
    await expect(page.locator('#SAFE-02-finding')).toBeFocused();
  });

  test('scores all six reference evaluations at 100/100 with boundary explanations', async ({ page }) => {
    await completeAssessment(page);
    await expect(page.locator('#completedCount')).toHaveText('6/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#feedbackList article.feedback')).toHaveCount(6);
    await expect(page.locator('#feedbackList .mark.full')).toHaveCount(6);
    await expect(page.locator('#resultIntro')).toContainText('6 fictional AI security cases');
    await expect(page.locator('#feedbackList article.feedback').first())
      .toContainText('The attempt alone is not evidence');
    await expect(page.locator('#feedbackList article.feedback').nth(2))
      .toContainText('authorization/data-isolation defect');
  });

  test('scores primary finding, boundary and severity independently', async ({ page }) => {
    await completeAssessment(page);
    // SAFE-02 is worth 20 points: finding 12, boundary 4, severity 4.
    await page.locator('#SAFE-02-finding').selectOption('direct-injection');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('88/100');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('8/20 points');

    await page.locator('#SAFE-02-boundary').selectOption('respected');
    await expect(page.locator('#results')).toBeHidden();
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('84/100');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('4/20 points');

    await page.locator('#SAFE-02-severity').selectOption('low');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('80/100');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('0/20 points');
  });

  test('keeps written evidence unscored and invalidates stale feedback on changes', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#SAFE-02-notes').fill('Retrieved FAQ injection changed the 14-day returns policy.');
    await page.locator('#SAFE-02-retest').fill('Retest the deadline with sanitized knowledge articles.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');

    await page.locator('#reviseButton').click();
    await expect(page.locator('#SAFE-01-finding')).toBeFocused();
    await page.locator('#SAFE-02-notes').fill('Updated evidence for the same incorrect return deadline.');
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#formStatus')).toContainText('Answers changed');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#SAFE-02-notes')).toHaveValue('Updated evidence for the same incorrect return deadline.');
  });

  test('resets selections, written evidence, counter and review feedback', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#SAFE-01-notes').fill('The assistant refused an unauthorized request.');
    await page.locator('#SAFE-01-retest').fill('Repeat in a new conversation.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
    await page.locator('#resetButton').click();
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#SAFE-01-finding')).toHaveValue('');
    await expect(page.locator('#SAFE-01-boundary')).toHaveValue('');
    await expect(page.locator('#SAFE-06-severity')).toHaveValue('');
    await expect(page.locator('#SAFE-01-notes')).toHaveValue('');
    await expect(page.locator('#SAFE-01-retest')).toHaveValue('');
    await expect(page.locator('#SAFE-01-finding')).toBeFocused();
    await expect(page.locator('#formStatus')).toContainText('Selections cleared');
  });

  test('downloads all findings and learner notes without changing browser storage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', '[{"id":"keep-history"}]');
      sessionStorage.setItem('m4-existing', 'keep-session');
    });
    await completeAssessment(page);
    const notes = 'Retrieved FAQ instructed the assistant to override the 14-day policy.';
    const retest = 'Assert that lower-trust article instructions cannot alter the return deadline.';
    await page.locator('#SAFE-02-notes').fill(notes);
    await page.locator('#SAFE-02-retest').fill(retest);
    await page.locator('#reviewButton').click();
    const before = await snapshotStorage(page);

    const waiting = page.waitForEvent('download');
    await page.locator('#downloadButton').click();
    const download = await waiting;
    expect(download.suggestedFilename()).toBe('ai-testing-module4-security-findings.txt');
    const path = await download.path();
    expect(path).not.toBeNull();
    const text = await readFile(path!, 'utf8');
    expect(text).toContain('PRACTICAL QA LAB — AI TESTING MODULE 4');
    expect(text).toContain('Not a live penetration test');
    expect(text).toContain('Assessment score: 100/100');
    for (const item of referenceCases) expect(text).toContain(item.id);
    expect(text).toContain('Trusted control:');
    expect(text).toContain('Observed response and system trace:');
    expect(text).toContain('customer202@example.invalid');
    expect(text).toContain(`Evidence and impact: ${notes}`);
    expect(text).toContain(`Follow-up QA test: ${retest}`);
    expect(text).toContain('Reference explanation:');
    await expect(page.locator('#downloadStatus')).toContainText('download prepared');
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('does not write to storage and clears unsaved answers after reload', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', '[{"id":"leave-intact"}]');
      localStorage.setItem('m4-unrelated', 'keep-me');
      sessionStorage.setItem('m4-sentinel', 'keep-session');
    });
    const before = await snapshotStorage(page);
    await completeAssessment(page);
    await page.locator('#SAFE-03-notes').fill('Cross-account invoice defect with isolated test data.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    expect(await snapshotStorage(page)).toEqual(before);

    await page.reload();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#SAFE-01-finding')).toHaveValue('');
    await expect(page.locator('#SAFE-03-notes')).toHaveValue('');
    await expect(page.locator('#results')).toBeHidden();
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('supports mobile width, labeled keyboard inputs and back navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#practiceTitle')).toBeVisible();
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport + 2);

    await page.locator('#SAFE-01-finding').focus();
    await expect(page.locator('#SAFE-01-finding')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#SAFE-01-boundary')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#SAFE-01-severity')).toBeFocused();
    await expect(page.locator('#SAFE-01-finding')).toHaveAccessibleName('Primary finding');
    await expect(page.locator('#SAFE-01-boundary')).toHaveAccessibleName('Trust-boundary verdict');
    await expect(page.locator('#SAFE-01-severity')).toHaveAccessibleName('Impact / severity');
    await page.locator('nav[aria-label="AI Testing navigation"] a[href="../module-3/"]').click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-3\//);
  });
});
