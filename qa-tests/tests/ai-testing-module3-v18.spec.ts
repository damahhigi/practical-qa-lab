import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const LAB_URL = '/ai-testing-lab/module-3/';

// Reference answers for six fictional, deterministic RAG investigation fixtures.
// These tests verify the practice UI; they do not test a live AI model.
const referenceCases = [
  { id: 'RAG-01', cause: 'pass', evidence: 'supported', severity: 'none', weight: 15 },
  { id: 'RAG-02', cause: 'generation', evidence: 'fabricated', severity: 'high', weight: 20 },
  { id: 'RAG-03', cause: 'retrieval', evidence: 'missing', severity: 'medium', weight: 15 },
  { id: 'RAG-04', cause: 'both', evidence: 'unsupported', severity: 'high', weight: 20 },
  { id: 'RAG-05', cause: 'conflict', evidence: 'conflicting', severity: 'medium', weight: 15 },
  { id: 'RAG-06', cause: 'generation', evidence: 'citation_mismatch', severity: 'medium', weight: 15 },
] as const;

async function completeAssessment(page: Page) {
  for (const item of referenceCases) {
    await page.locator(`#${item.id}-cause`).selectOption(item.cause);
    await page.locator(`#${item.id}-evidence`).selectOption(item.evidence);
    await page.locator(`#${item.id}-severity`).selectOption(item.severity);
  }
}

async function snapshotStorage(page: Page) {
  return page.evaluate(() => ({
    local: Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]),
    session: Object.keys(sessionStorage).sort().map(key => [key, sessionStorage.getItem(key)]),
  }));
}

test.describe('v1.8 AI Testing Lab — Module 3: RAG evidence evaluation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(LAB_URL);
  });

  test('shows six evidence-based cases, accessible fields and a 100-point rubric', async ({ page }) => {
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI — RAG Evidence Review');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#results')).toBeHidden();

    for (const item of referenceCases) {
      const card = page.locator(`article.case[data-case-id="${item.id}"]`);
      await expect(card).toBeVisible();
      await expect(card.locator('.source-panel')).toHaveCount(2);
      await expect(card.locator('.source-panel').first()).toContainText('QA source register');
      await expect(card.locator('.source-panel').last()).toContainText('Retrieved excerpts');
      await expect(card.locator('.assistant-response')).toContainText('Simulated AI response');
      await expect(card.locator('.points')).toContainText(`${item.weight} points`);
      for (const field of ['cause', 'evidence', 'severity']) {
        await expect(page.locator(`#${item.id}-${field}`)).toHaveAttribute('required', '');
        await expect(page.locator(`#${item.id}-${field}`)).toHaveValue('');
      }
      for (const field of ['notes', 'retest']) {
        await expect(page.locator(`#${item.id}-${field}`)).toHaveAttribute('maxlength', '1200');
      }
    }
    expect(referenceCases.reduce((sum, item) => sum + item.weight, 0)).toBe(100);
  });

  test('shows distinct retrieval, archived-policy, source-conflict and citation evidence', async ({ page }) => {
    const third = page.locator('[data-case-id="RAG-03"]');
    await expect(third.locator('.source-panel').first()).toContainText('WARRANTY-07');
    await expect(third.locator('.source-panel').last()).not.toContainText('WARRANTY-07');

    const fourth = page.locator('[data-case-id="RAG-04"]');
    await expect(fourth.locator('.source-panel').first()).toContainText('RETURNS-2026');
    await expect(fourth.locator('.source-panel').last()).not.toContainText('RETURNS-2026');
    await expect(fourth.locator('.source-panel').last()).toContainText('RETURNS-2025');
    await expect(fourth.locator('.source-panel').last().locator('.source-status.archived')).toHaveCount(1);

    const fifth = page.locator('[data-case-id="RAG-05"]');
    await expect(fifth.locator('.source-panel').last()).toContainText('PICKUP-05');
    await expect(fifth.locator('.source-panel').last()).toContainText('LOCATION-09');

    const sixth = page.locator('[data-case-id="RAG-06"]');
    await expect(sixth.locator('.source-panel').last()).toContainText('PICK-02');
    await expect(sixth.locator('.assistant-response')).toContainText('[FAQ-08]');
  });

  test('blocks incomplete reviews and focuses the missing field', async ({ page }) => {
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Complete the cause selection for RAG-01');
    await expect(page.locator('#RAG-01-cause')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();

    await page.locator('#RAG-01-cause').selectOption('pass');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Complete the evidence selection for RAG-01');
    await expect(page.locator('#RAG-01-evidence')).toBeFocused();

    await page.locator('#RAG-01-evidence').selectOption('supported');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Complete the severity selection for RAG-01');
    await expect(page.locator('#RAG-01-severity')).toBeFocused();

    await page.locator('#RAG-01-severity').selectOption('none');
    await expect(page.locator('#completedCount')).toHaveText('1/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('RAG-02');
    await expect(page.locator('#RAG-02-cause')).toBeFocused();
  });

  test('awards 100/100 with all reference answers and six evidence explanations', async ({ page }) => {
    await completeAssessment(page);
    await expect(page.locator('#completedCount')).toHaveText('6/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#feedbackList article.feedback')).toHaveCount(6);
    await expect(page.locator('#feedbackList .mark.full')).toHaveCount(6);
    await expect(page.locator('#resultIntro')).toContainText('6 fictional RAG investigations');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('invented a policy section');
    await expect(page.locator('#feedbackList article.feedback').nth(5)).toContainText('PICK-02');
  });

  test('scores primary issue, evidence verdict and severity independently', async ({ page }) => {
    await completeAssessment(page);
    // RAG-02 is 20 points: issue 12, evidence 4 and severity 4.
    await page.locator('#RAG-02-cause').selectOption('retrieval');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('88/100');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('8/20 points');

    await page.locator('#RAG-02-evidence').selectOption('missing');
    await expect(page.locator('#results')).toBeHidden();
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('84/100');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('4/20 points');

    await page.locator('#RAG-02-severity').selectOption('low');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('80/100');
    await expect(page.locator('#feedbackList article.feedback').nth(1)).toContainText('0/20 points');
  });

  test('keeps written evidence unscored and invalidates feedback when notes change', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#RAG-03-notes').fill('WARRANTY-07 appears in the QA register but not in retrieval.');
    await page.locator('#RAG-03-retest').fill('Retrieve WARRANTY-07 with a refurbished tablet query.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');

    await page.locator('#RAG-03-notes').fill('The relevant warranty source was not in top-k.');
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#formStatus')).toContainText('Answers changed');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    await expect(page.locator('#RAG-03-notes')).toHaveValue('The relevant warranty source was not in top-k.');
  });

  test('clears all three selections, written evidence, feedback and the counter', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#RAG-01-notes').fill('Source finding');
    await page.locator('#RAG-01-retest').fill('Source retest');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();

    await page.locator('#resetButton').click();
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#RAG-01-cause')).toHaveValue('');
    await expect(page.locator('#RAG-01-evidence')).toHaveValue('');
    await expect(page.locator('#RAG-06-severity')).toHaveValue('');
    await expect(page.locator('#RAG-01-notes')).toHaveValue('');
    await expect(page.locator('#RAG-01-retest')).toHaveValue('');
    await expect(page.locator('#RAG-01-cause')).toBeFocused();
    await expect(page.locator('#formStatus')).toContainText('Selections cleared');
  });

  test('downloads all source records, retrieved evidence and learner notes without changing storage', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', '[{"id":"preserve-history"}]');
      sessionStorage.setItem('ai-m3-test-sentinel', 'preserve-session');
    });
    await completeAssessment(page);
    const notes = 'SHIP-11 explicitly denies the next-day guarantee. Section 9.4 is fabricated.';
    const retest = 'Check retrieved citation IDs before accepting any shipping guarantee.';
    await page.locator('#RAG-02-notes').fill(notes);
    await page.locator('#RAG-02-retest').fill(retest);
    await page.locator('#reviewButton').click();
    const before = await snapshotStorage(page);

    const event = page.waitForEvent('download');
    await page.locator('#downloadButton').click();
    const download = await event;
    expect(download.suggestedFilename()).toBe('ai-testing-module3-rag-findings.txt');
    const filePath = await download.path();
    expect(filePath).not.toBeNull();
    const text = await readFile(filePath!, 'utf8');

    expect(text).toContain('PRACTICAL QA LAB — AI TESTING MODULE 3');
    expect(text).toContain('Not an evaluation of a live AI model');
    expect(text).toContain('Assessment score: 100/100');
    for (const scenario of referenceCases) expect(text).toContain(scenario.id);
    expect(text).toContain('QA source register (not necessarily available to the assistant):');
    expect(text).toContain('Retrieved excerpts (available to the simulated assistant):');
    expect(text).toContain('WARRANTY-07');
    expect(text).toContain('RETURNS-2025 [archived]');
    expect(text).toContain('Simulated AI response:');
    expect(text).toContain('Learner primary issue:');
    expect(text).toContain('Learner evidence verdict:');
    expect(text).toContain(`Evidence and source IDs: ${notes}`);
    expect(text).toContain(`Follow-up QA test: ${retest}`);
    expect(text).toContain('Reference explanation:');
    await expect(page.locator('#downloadStatus')).toContainText('download prepared');
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('does not persist answers, modify existing browser data or retain them after reload', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', '[{"id":"preserve-existing"}]');
      localStorage.setItem('module3-unrelated', 'keep-me');
      sessionStorage.setItem('module3-sentinel', 'keep-session');
    });
    const before = await snapshotStorage(page);
    await completeAssessment(page);
    await page.locator('#RAG-05-notes').fill('Unresolved source conflict: PICKUP-05 and LOCATION-09.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100/100');
    expect(await snapshotStorage(page)).toEqual(before);

    await page.reload();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#RAG-01-cause')).toHaveValue('');
    await expect(page.locator('#RAG-05-notes')).toHaveValue('');
    await expect(page.locator('#results')).toBeHidden();
    expect(await snapshotStorage(page)).toEqual(before);
  });

  test('supports mobile layout, keyboard traversal and navigation back to Module 2', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('#practiceTitle')).toBeVisible();
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    const dimensions = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 2);

    await page.locator('#RAG-01-cause').focus();
    await expect(page.locator('#RAG-01-cause')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#RAG-01-evidence')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#RAG-01-severity')).toBeFocused();
    await page.locator('#RAG-01-cause').selectOption('pass');
    await page.locator('#RAG-01-evidence').selectOption('supported');
    await page.locator('#RAG-01-severity').selectOption('none');
    await expect(page.locator('#completedCount')).toHaveText('1/6');
    await expect(page.locator('nav[aria-label="AI Testing navigation"] a').first())
      .toHaveAttribute('href', '../module-2/');
    await expect(page.locator('.skip-link')).toHaveAttribute('href', '#main');
  });
});
