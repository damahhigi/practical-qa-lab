import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const reportKey = 'practicalQaLabCheckoutReportsV1';
const progressKey = 'practicalQaLab.progress.v1';

const first = {
  title: 'Quantity update leaves the cart subtotal unchanged',
  requirement: 'REQ-03',
  severity: 'Major',
  steps: '1. Add one Notebook.\n2. Increase its quantity to two.\n3. Check the subtotal.',
  expected: 'The subtotal should update to KES 2,000.',
  actual: 'The subtotal remains KES 1,000 after the quantity increases.'
};

const second = {
  title: 'Discount is not deducted from the checkout total',
  requirement: 'REQ-06',
  severity: 'Critical',
  steps: '1. Add a Wireless Mouse and Headphones.\n2. Apply SAVE10.\n3. Read the final total.',
  expected: 'The final total should reflect a KES 400 discount.',
  actual: 'The final total still displays KES 4,000 despite the discount.'
};

type ReportInput = typeof first;

async function saveReport(page: Page, report: ReportInput) {
  await page.locator('#reportTitle').fill(report.title);
  await page.locator('#reportRequirement').selectOption(report.requirement);
  await page.locator('#reportSeverity').selectOption(report.severity);
  await page.locator('#reportSteps').fill(report.steps);
  await page.locator('#reportExpected').fill(report.expected);
  await page.locator('#reportActual').fill(report.actual);
  await page.locator('#saveReport').click();
}

async function downloadText(page: Page) {
  const pending = page.waitForEvent('download');
  await page.locator('#exportCheckoutReports').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('northstar-shop-defect-reports.txt');
  return readFile(await download.path(), 'utf8');
}

test.describe('v1.6 Checkout Bug Hunt — report export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/checkout-bug-hunt/');
  });

  test('download is disabled when no reports have been saved', async ({ page }) => {
    await expect(page.locator('#reportCount')).toHaveText('0 reports');
    await expect(page.locator('#exportCheckoutReports')).toBeDisabled();
    await expect(page.locator('#checkoutExportStatus'))
      .toContainText('Save a bug report');
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey))
      .toBeNull();
  });

  test('downloads every field without changing reports or My Progress', async ({ page }) => {
    await saveReport(page, first);
    await expect(page.locator('#reportCount')).toHaveText('1 report');
    await expect(page.locator('#exportCheckoutReports')).toBeEnabled();

    const savedProgress = JSON.stringify([{ id: 'existing-manual-session',
      type: 'practice', area: 'manual', score: 85, maxScore: 100,
      completedAt: '2026-10-26T09:00:00.000Z', questionScores: [] }]);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value),
      [progressKey, savedProgress] as const);

    const beforeReports = await page.evaluate(key => localStorage.getItem(key), reportKey);
    const text = await downloadText(page);

    expect(text).toContain('Practical QA Lab | Guided simulation');
    expect(text).toContain(first.title);
    expect(text).toContain(`Requirement: ${first.requirement}`);
    expect(text).toContain(`Suggested severity: ${first.severity}`);
    expect(text).toContain(first.steps);
    expect(text).toContain(first.expected);
    expect(text).toContain(first.actual);
    expect(text).toContain('Reference: bug-');
    expect(text).toContain('REPORT 1:');

    expect(await page.evaluate(key => localStorage.getItem(key), reportKey))
      .toBe(beforeReports);
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey))
      .toBe(savedProgress);
    await expect(page.locator('#reportCount')).toHaveText('1 report');
  });

  test('exports revised details after editing a report', async ({ page }) => {
    await saveReport(page, first);
    await page.locator('#savedReports [data-edit-report]').click();

    const updated = 'Updated finding: subtotal stays at KES 1,000 after increasing quantity.';
    await page.locator('#reportActual').fill(updated);
    await page.locator('#saveReport').click();

    const text = await downloadText(page);
    expect(text).toContain(updated);
    expect(text).not.toContain(first.actual);
    expect(text).toContain(first.title);
    await expect(page.locator('#reportCount')).toHaveText('1 report');
  });

  test('exports all saved reports after reloading the page', async ({ page }) => {
    await saveReport(page, first);
    await saveReport(page, second);
    await expect(page.locator('#reportCount')).toHaveText('2 reports');

    await page.reload();
    await expect(page.locator('#exportCheckoutReports')).toBeEnabled();
    const text = await downloadText(page);

    expect(text).toContain('Reports: 2');
    expect(text).toContain(`REPORT 1: ${second.title}`);
    expect(text).toContain(`REPORT 2: ${first.title}`);
    expect(text).toContain(first.actual);
    expect(text).toContain(second.actual);
    await expect(page.locator('#reportCount')).toHaveText('2 reports');
  });

  test('disables export after the final report is deleted', async ({ page }) => {
    await saveReport(page, first);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#savedReports [data-delete-report]').click();

    await expect(page.locator('#reportCount')).toHaveText('0 reports');
    await expect(page.locator('#exportCheckoutReports')).toBeDisabled();
    expect(JSON.parse((await page.evaluate(key =>
      localStorage.getItem(key), reportKey)) || '[]')).toEqual([]);
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey))
      .toBeNull();
  });
});
