import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Only Playwright's isolated browser profile is used. These tests never
// access the learner's everyday browser progress or locally saved reports.
const reportKey = 'practical-qa-sql-validation-reports-v1';
const progressKey = 'practicalQaLab.progress.v1';

const totalsFinding = {
  caseId: 'totals',
  title: 'Negative paid-order total violates business validation',
  query: 'SELECT id, customer_id, total FROM orders ORDER BY total ASC;',
  expected: 'Every order total should be zero or greater; no negative values are permitted.',
  actual: 'Order 5010 has a total of -350, violating the non-negative totals requirement.'
} as const;

const ownershipFinding = {
  caseId: 'ownership',
  title: 'Paid order references a customer that does not exist',
  query: 'SELECT id, customer_id, total FROM orders ORDER BY customer_id ASC;',
  expected: 'Every order must reference an existing customer.',
  actual: 'Order 5009 references customer 999, which does not exist.'
} as const;

type Finding = {
  caseId: 'totals' | 'ownership' | 'emails';
  title: string;
  query: string;
  expected: string;
  actual: string;
};

async function saveFinding(page: Page, finding: Finding) {
  await page.locator('#sqlReportCase').selectOption(finding.caseId);
  await page.locator('#sqlReportTitle').fill(finding.title);
  await page.locator('#sqlReportQuery').fill(finding.query);
  await page.locator('#sqlReportExpected').fill(finding.expected);
  await page.locator('#sqlReportActual').fill(finding.actual);
  await page.locator('#saveSqlReport').click();
}

async function downloadReports(page: Page): Promise<string> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#downloadSqlReports').click()
  ]);
  expect(download.suggestedFilename()).toBe('sql-validation-defect-reports.txt');
  return readFile(await download.path(), 'utf8');
}

test.describe('v1.6 SQL Validation — report export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sql-validation-lab/');
    // The saved-report workspace is part of the Investigation dataset view.
    await page.locator('[data-dataset="investigation"]').click();
    await expect(page.locator('#investigationSection')).toBeVisible();
  });

  test('disables downloads when no reports are saved', async ({ page }) => {
    await expect(page.locator('#sqlReportCount')).toHaveText('0');
    await expect(page.locator('#downloadSqlReports')).toBeDisabled();
    await expect(page.locator('#downloadSqlStatus'))
      .toContainText('Save a report to enable downloads.');
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey))
      .toBeNull();
  });

  test('exports all SQL evidence without altering reports or My Progress', async ({ page }) => {
    const existingProgress = JSON.stringify([{
      id: 'existing-manual-session', type: 'practice', area: 'manual',
      score: 80, maxScore: 100, completedAt: '2026-10-26T09:00:00.000Z',
      questionScores: []
    }]);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value),
      [progressKey, existingProgress] as const);

    await saveFinding(page, totalsFinding);
    await expect(page.locator('#sqlReportCount')).toHaveText('1');
    await expect(page.locator('#downloadSqlReports')).toBeEnabled();

    const before = await page.evaluate(key => localStorage.getItem(key), reportKey);
    const text = await downloadReports(page);

    expect(text).toContain('SQL VALIDATION — DEFECT REPORTS');
    expect(text).toContain('Practical QA Lab | Guided simulation');
    expect(text).toContain('Learner-written findings; not independently verified.');
    expect(text).toContain('Reports: 1');
    expect(text).toContain(`REPORT 1: ${totalsFinding.title}`);
    expect(text).toContain('Reference: SQL-001');
    expect(text).toContain('Investigation case: Case 01 — Order totals');
    expect(text).toContain('EVIDENCE — SQL QUERY');
    expect(text).toContain(totalsFinding.query);
    expect(text).toContain('EXPECTED RESULT');
    expect(text).toContain(totalsFinding.expected);
    expect(text).toContain('ACTUAL RESULT');
    expect(text).toContain(totalsFinding.actual);

    expect(await page.evaluate(key => localStorage.getItem(key), reportKey))
      .toBe(before);
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey))
      .toBe(existingProgress);
  });

  test('exports edited details rather than outdated report text', async ({ page }) => {
    await saveFinding(page, totalsFinding);
    await page.getByRole('button', { name: 'Edit SQL-001' }).click();

    const corrected = 'Order 5010 contains -350 in the total column; this is an invalid amount.';
    await page.locator('#sqlReportActual').fill(corrected);
    await page.locator('#saveSqlReport').click();

    await expect(page.locator('#sqlReportCount')).toHaveText('1');
    const text = await downloadReports(page);
    expect(text).toContain(corrected);
    expect(text).not.toContain(totalsFinding.actual);
    expect(text).toContain('Reference: SQL-001');
    expect(text).toContain(totalsFinding.query);
  });

  test('downloads multiple saved reports after a page refresh', async ({ page }) => {
    await saveFinding(page, totalsFinding);
    await saveFinding(page, ownershipFinding);
    await expect(page.locator('#sqlReportCount')).toHaveText('2');

    await page.reload();
    await page.locator('[data-dataset="investigation"]').click();
    await expect(page.locator('#sqlReportCount')).toHaveText('2');
    await expect(page.locator('#downloadSqlReports')).toBeEnabled();
    const before = await page.evaluate(key => localStorage.getItem(key), reportKey);

    const text = await downloadReports(page);
    expect(text).toContain('Reports: 2');
    expect(text).toContain(`REPORT 1: ${totalsFinding.title}`);
    expect(text).toContain(`REPORT 2: ${ownershipFinding.title}`);
    expect(text).toContain('Reference: SQL-001');
    expect(text).toContain('Reference: SQL-002');
    expect(text).toContain('Investigation case: Case 02 — Order ownership');
    expect(text).toContain(totalsFinding.actual);
    expect(text).toContain(ownershipFinding.query);
    expect(text).toContain(ownershipFinding.actual);
    expect(await page.evaluate(key => localStorage.getItem(key), reportKey))
      .toBe(before);
  });

  test('disables downloads after deleting the final saved report', async ({ page }) => {
    await saveFinding(page, totalsFinding);
    await expect(page.locator('#downloadSqlReports')).toBeEnabled();

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete SQL-001' }).click();

    await expect(page.locator('#sqlReportCount')).toHaveText('0');
    await expect(page.locator('#downloadSqlReports')).toBeDisabled();
    await expect(page.locator('#downloadSqlStatus'))
      .toContainText('Save a report to enable downloads.');

    const saved = await page.evaluate(key => localStorage.getItem(key), reportKey);
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!).reports).toEqual([]);
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey))
      .toBeNull();
  });
});
