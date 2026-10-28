import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const reportKey = 'pqa_api_bug_hunt_reports_v1';
const progressKey = 'practicalQaLab.progress.v1';

const createFinding = {
  scenario: 'create',
  title: 'POST returns 200 instead of 201 and omits Location',
  severity: 'Major',
  steps: '1. Select Create a user.\n2. Send POST /api/users.\n3. Inspect status and headers.',
  expected: 'POST should return 201 Created with a Location header.',
  actual: 'The simulated service returns 200 OK and no Location header.'
} as const;

const patchFinding = {
  scenario: 'patch',
  title: 'PATCH clears an unrelated email address',
  severity: 'Critical',
  steps: '1. Send PATCH /api/users/101.\n2. Follow up with GET.\n3. Check email.',
  expected: 'Only role should change; the original email must remain.',
  actual: 'The email is blank after changing only the role.'
} as const;

type Finding = {
  scenario: 'create' | 'patch' | 'delete';
  title: string;
  severity: 'Major' | 'Minor' | 'Critical';
  steps: string;
  expected: string;
  actual: string;
};

async function saveFinding(page: Page, finding: Finding) {
  await page.locator('#reportScenario').selectOption(finding.scenario);
  await page.locator('#bugTitle').fill(finding.title);
  await page.locator('#bugSteps').fill(finding.steps);
  await page.locator('#bugExpected').fill(finding.expected);
  await page.locator('#bugActual').fill(finding.actual);
  await page.locator('#bugSeverity').selectOption(finding.severity);
  await page.locator('#saveReport').click();
}

async function downloadReports(page: Page): Promise<string> {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#downloadApiReports').click()
  ]);
  expect(download.suggestedFilename()).toBe('api-bug-hunt-defect-reports.txt');
  return readFile(await download.path(), 'utf8');
}

test.describe('v1.6 API Bug Hunt — report export', () => {
  test.beforeEach(async ({ page }) => {
    // Playwright creates an isolated browser context for each test.
    await page.goto('/api-bug-hunt/');
  });

  test('keeps the download button disabled when there are no reports', async ({ page }) => {
    await expect(page.locator('#reportCount')).toHaveText('0');
    await expect(page.locator('#downloadApiReports')).toBeDisabled();
    await expect(page.locator('#downloadApiStatus'))
      .toContainText('Save a report to enable downloads.');
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey))
      .toBeNull();
  });

  test('downloads all fields without changing reports or My Progress', async ({ page }) => {
    const existingProgress = JSON.stringify([{
      id: 'existing-qa-session', type: 'practice', area: 'manual',
      score: 80, maxScore: 100, completedAt: '2026-10-26T09:00:00.000Z',
      questionScores: []
    }]);
    await page.evaluate(([key, value]) => localStorage.setItem(key, value),
      [progressKey, existingProgress] as const);

    await saveFinding(page, createFinding);
    await expect(page.locator('#reportCount')).toHaveText('1');
    await expect(page.locator('#downloadApiReports')).toBeEnabled();

    const savedReportsBefore = await page.evaluate(key => localStorage.getItem(key), reportKey);
    const text = await downloadReports(page);

    expect(text).toContain('API BUG HUNT — DEFECT REPORTS');
    expect(text).toContain('Practical QA Lab | Guided simulation');
    expect(text).toContain('Learner-written findings; not independently verified.');
    expect(text).toContain('Reports: 1');
    expect(text).toContain(`REPORT 1: ${createFinding.title}`);
    expect(text).toContain('Reference: API-001');
    expect(text).toContain('Scenario: Create a fictional user');
    expect(text).toContain('Requirement: A valid POST to /api/users must create a user and return 201 Created');
    expect(text).toContain(`Suggested severity: ${createFinding.severity}`);
    expect(text).toContain('Saved at:');
    expect(text).toContain(createFinding.steps);
    expect(text).toContain(createFinding.expected);
    expect(text).toContain(createFinding.actual);

    expect(await page.evaluate(key => localStorage.getItem(key), reportKey))
      .toBe(savedReportsBefore);
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey))
      .toBe(existingProgress);
  });

  test('exports edited details rather than obsolete report text', async ({ page }) => {
    await saveFinding(page, createFinding);
    await page.getByRole('button', { name: 'Edit API-001' }).click();

    const corrected = 'The simulated response is 200 OK; the required Location header is absent.';
    await page.locator('#bugActual').fill(corrected);
    await page.locator('#saveReport').click();

    await expect(page.locator('#reportCount')).toHaveText('1');
    const text = await downloadReports(page);
    expect(text).toContain(corrected);
    expect(text).not.toContain(createFinding.actual);
    expect(text).toContain('Reference: API-001');
    expect(text).toContain(createFinding.title);
  });

  test('downloads multiple saved reports after a page reload', async ({ page }) => {
    await saveFinding(page, createFinding);
    await saveFinding(page, patchFinding);
    await expect(page.locator('#reportCount')).toHaveText('2');

    await page.reload();
    await expect(page.locator('#downloadApiReports')).toBeEnabled();
    const text = await downloadReports(page);

    expect(text).toContain('Reports: 2');
    expect(text).toContain(`REPORT 1: ${createFinding.title}`);
    expect(text).toContain(`REPORT 2: ${patchFinding.title}`);
    expect(text).toContain('Reference: API-001');
    expect(text).toContain('Reference: API-002');
    expect(text).toContain('Scenario: Update one field only');
    expect(text).toContain('Requirement: PATCH /api/users/101 must change only fields supplied');
    expect(text).toContain(createFinding.actual);
    expect(text).toContain(patchFinding.actual);
    await expect(page.locator('#reportCount')).toHaveText('2');
  });

  test('disables downloading after deleting the last report', async ({ page }) => {
    await saveFinding(page, createFinding);
    await expect(page.locator('#downloadApiReports')).toBeEnabled();

    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Delete API-001' }).click();

    await expect(page.locator('#reportCount')).toHaveText('0');
    await expect(page.locator('#downloadApiReports')).toBeDisabled();
    await expect(page.locator('#downloadApiStatus'))
      .toContainText('Save a report to enable downloads.');

    const stored = await page.evaluate(key => localStorage.getItem(key), reportKey);
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!).reports).toEqual([]);
    expect(await page.evaluate(key => localStorage.getItem(key), progressKey))
      .toBeNull();
  });
});
