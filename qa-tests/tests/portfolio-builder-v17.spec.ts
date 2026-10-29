import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const keys = {
  cases: 'pqa_test_case_lab_stage2_v1',
  checkout: 'practicalQaLabCheckoutReportsV1',
  api: 'pqa_api_bug_hunt_reports_v1',
  sql: 'practical-qa-sql-validation-reports-v1',
  progress: 'practicalQaLab.progress.v1',
} as const;

const caseRecord = {
  id: 'TC-001',
  scenario: 'Verify registration boundaries',
  requirement: 'REQ-01',
  type: 'Functional',
  priority: 'High',
  preconditions: 'Registration page is available',
  steps: 'Enter a valid email and password, then submit',
  testData: 'learner@example.test',
  expectedResult: 'The account is created',
};

const checkoutRecord = {
  id: 'BUG-001',
  title: 'Cart quantity does not update total',
  requirement: 'REQ-03',
  severity: 'Major',
  steps: 'Increase the item quantity to two',
  expected: 'The subtotal doubles',
  actual: 'The subtotal is unchanged',
};

const apiRecord = {
  id: 'API-001',
  title: 'Create user omits expected location',
  scenario: 'create',
  severity: 'Major',
  steps: 'POST a valid user',
  expected: 'Response includes a Location header',
  actual: 'Location header is missing',
};

const sqlRecord = {
  id: 'SQL-001',
  title: 'Order totals disagree with line items',
  caseId: 'totals',
  query: 'SELECT * FROM orders',
  expected: 'Stored totals match line item sums',
  actual: 'One stored total differs',
};

const progressRecord = {
  id: 'automation-m1-c1c2',
  type: 'practice',
  area: 'automation',
  score: 85,
  maxScore: 100,
  completedAt: '2026-10-28T08:00:00.000Z',
};

function evidenceStorage(): Record<string, unknown> {
  return {
    [keys.cases]: { version: 1, nextSequence: 2, cases: [caseRecord] },
    [keys.checkout]: [checkoutRecord],
    [keys.api]: {
      version: 1,
      format: 'pqa-api-bug-hunt-reports',
      reports: [apiRecord],
    },
    [keys.sql]: { version: 1, reports: [sqlRecord] },
    [keys.progress]: [progressRecord],
  };
}

async function openWithEvidence(page: Page, data: Record<string, unknown> = evidenceStorage()) {
  // The isolated Playwright browser context is not the learner's daily browser.
  await page.goto('/');
  await page.evaluate((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, data);
  await page.goto('/portfolio/');
}

async function storedEvidence(page: Page) {
  return page.evaluate((names) => Object.fromEntries(
    Object.values(names).map(key => [key, localStorage.getItem(key)])
  ), keys);
}

async function select(page: Page, id: string) {
  await page.locator(`input[data-evidence-id="${id}"]`).check();
}

async function getDownload(page: Page) {
  const event = page.waitForEvent('download');
  await page.locator('#downloadPortfolio').click();
  const download = await event;
  expect(download.suggestedFilename()).toBe('qa-practice-portfolio.html');
  return readFile(await download.path(), 'utf8');
}

test.describe('v1.7 Portfolio Builder — saved evidence and HTML export', () => {
  test('empty browser shows no selectable artifacts or enabled export controls', async ({ page }) => {
    await page.goto('/portfolio/');
    await expect(page.locator('.builder-source')).toHaveCount(5);
    await expect(page.locator('[data-evidence-id]')).toHaveCount(0);
    await expect(page.locator('#selectionCount')).toContainText('0 selected');
    await expect(page.locator('#previewPortfolio')).toBeDisabled();
    await expect(page.locator('#downloadPortfolio')).toBeDisabled();
    await expect(page.locator('#portfolioPreview')).toBeHidden();
  });

  test('recognizes all five evidence formats and selects nothing by default', async ({ page }) => {
    await openWithEvidence(page);
    await expect(page.locator('.builder-source')).toHaveCount(5);
    await expect(page.locator('[data-evidence-id]')).toHaveCount(5);
    await expect(page.locator('input[data-evidence-id]:checked')).toHaveCount(0);
    for (const id of ['case:0', 'checkout:0', 'api:0', 'sql:0', 'progress:0']) {
      await expect(page.locator(`input[data-evidence-id="${id}"]`)).toBeVisible();
    }
    await expect(page.locator('#previewPortfolio')).toBeDisabled();
  });

  test('previews selected items only with editable details and simulation labels', async ({ page }) => {
    await openWithEvidence(page);
    await select(page, 'case:0');
    await select(page, 'sql:0');
    await expect(page.locator('#selectionCount')).toContainText('2 selected');
    await page.locator('#portfolioTitle').fill('My QA Evidence');
    await page.locator('#portfolioAuthor').fill('QA Learner');
    await page.locator('#portfolioSummary').fill('Sample test design and SQL validation work.');
    await page.locator('#previewPortfolio').click();
    await expect(page.locator('#portfolioPreview')).toBeVisible();
    await expect(page.locator('#downloadPortfolio')).toBeEnabled();
    const document = page.frameLocator('#portfolioPreviewFrame');
    await expect(document.locator('h1')).toHaveText('My QA Evidence');
    await expect(document.locator('body')).toContainText('Sample test design and SQL validation work.');
    await expect(document.locator('body')).toContainText(caseRecord.scenario);
    await expect(document.locator('body')).toContainText(sqlRecord.query);
    await expect(document.locator('body')).not.toContainText(checkoutRecord.title);
    await expect(document.locator('body')).toContainText('Practice / guided simulations only.');
  });

  test('download is self-contained, includes chosen fields, and does not alter browser evidence', async ({ page }) => {
    await openWithEvidence(page);
    const before = await storedEvidence(page);
    for (const id of ['case:0', 'checkout:0', 'api:0', 'sql:0', 'progress:0']) {
      await select(page, id);
    }
    await page.locator('#portfolioTitle').fill('Portfolio Export Verification');
    await page.locator('#previewPortfolio').click();
    const html = await getDownload(page);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Portfolio Export Verification');
    expect(html).toContain('5 selected practice artifacts');
    expect(html).toContain(caseRecord.scenario);
    expect(html).toContain(checkoutRecord.actual);
    expect(html).toContain(apiRecord.expected);
    expect(html).toContain(sqlRecord.query);
    expect(html).toContain('85/100');
    expect(html).toContain('not independently verified production defects');
    expect(html).not.toMatch(/<script\b/i);
    expect(html).not.toMatch(/<(?:link|iframe)\b/i);
    expect(html).not.toMatch(/https?:\/\//i);
    expect(await storedEvidence(page)).toEqual(before);
  });

  test('escapes HTML-like learner evidence and portfolio metadata', async ({ page }) => {
    const malicious = `<img src=x onerror="alert('unsafe')">`;
    const data = evidenceStorage();
    data[keys.checkout] = [{ ...checkoutRecord, title: malicious, actual: '<script>bad()</script>' }];
    await openWithEvidence(page, data);
    await select(page, 'checkout:0');
    await page.locator('#portfolioTitle').fill('<svg onload=alert(1)>');
    await page.locator('#portfolioSummary').fill('<b>learner supplied</b>');
    await page.locator('#previewPortfolio').click();
    const html = await getDownload(page);
    expect(html).not.toContain(malicious);
    expect(html).not.toContain('<script>bad()</script>');
    expect(html).toContain('&lt;img src=x onerror=&quot;alert(&#39;unsafe&#39;)&quot;&gt;');
    expect(html).toContain('&lt;script&gt;bad()&lt;/script&gt;');
    expect(html).toContain('&lt;svg onload=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;learner supplied&lt;/b&gt;');
    await expect(page.locator('#portfolioPreviewFrame')).toHaveAttribute('sandbox', '');
  });

  test('changing portfolio details clears the old preview until regenerated', async ({ page }) => {
    await openWithEvidence(page);
    await select(page, 'case:0');
    await page.locator('#previewPortfolio').click();
    await expect(page.locator('#downloadPortfolio')).toBeEnabled();
    await page.locator('#portfolioTitle').fill('New portfolio title');
    await expect(page.locator('#downloadPortfolio')).toBeDisabled();
    await expect(page.locator('#portfolioPreview')).toBeHidden();
    await page.locator('#previewPortfolio').click();
    await expect(page.frameLocator('#portfolioPreviewFrame').locator('h1'))
      .toHaveText('New portfolio title');
    await expect(page.locator('#downloadPortfolio')).toBeEnabled();
  });

  test('refuses a stale record and requires refresh without changing saved data', async ({ page }) => {
    await openWithEvidence(page);
    await select(page, 'checkout:0');
    await page.evaluate((key) => {
      const reports = JSON.parse(localStorage.getItem(key) ?? '[]');
      reports[0].actual = 'Updated after selection';
      localStorage.setItem(key, JSON.stringify(reports));
    }, keys.checkout);
    const updated = await storedEvidence(page);
    await page.locator('#previewPortfolio').click();
    await expect(page.locator('#builderStatus')).toContainText('changed after selection');
    await expect(page.locator('#downloadPortfolio')).toBeDisabled();
    await page.locator('#refreshEvidence').click();
    await expect(page.locator('input[data-evidence-id]:checked')).toHaveCount(0);
    await expect(page.locator('#previewPortfolio')).toBeDisabled();
    await select(page, 'checkout:0');
    await page.locator('#previewPortfolio').click();
    await expect(page.frameLocator('#portfolioPreviewFrame').locator('body'))
      .toContainText('Updated after selection');
    expect(await storedEvidence(page)).toEqual(updated);
  });

  test('malformed data in one source does not block another or overwrite either', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(([checkoutKey, apiKey, record]) => {
      localStorage.setItem(checkoutKey, JSON.stringify([record]));
      localStorage.setItem(apiKey, '{malformed json');
    }, [keys.checkout, keys.api, checkoutRecord] as const);
    await page.goto('/portfolio/');
    await expect(page.locator('.builder-error')).toHaveCount(1);
    await expect(page.locator('input[data-evidence-id]')).toHaveCount(1);
    const before = await storedEvidence(page);
    await select(page, 'checkout:0');
    await page.locator('#previewPortfolio').click();
    const html = await getDownload(page);
    expect(html).toContain(checkoutRecord.title);
    expect(await storedEvidence(page)).toEqual(before);
  });

  test('enforces a maximum of 40 selected items', async ({ page }) => {
    const many = Array.from({ length: 41 }, (_, i) => ({
      ...checkoutRecord,
      id: `BUG-${String(i + 1).padStart(3, '0')}`,
      title: `Issue ${i + 1}`,
    }));
    await openWithEvidence(page, { [keys.checkout]: many });
    const choices = page.locator('input[data-evidence-id]');
    await expect(choices).toHaveCount(41);
    for (let i = 0; i < 40; i++) await choices.nth(i).check();
    await choices.nth(40).click();
    await expect(choices.nth(40)).not.toBeChecked();
    await expect(page.locator('#selectionCount')).toContainText('40 selected');
    await expect(page.locator('#builderStatus')).toContainText('up to 40 items');
    await page.locator('#previewPortfolio').click();
    await expect(page.locator('#builderStatus')).toContainText('40 selected practice item(s)');
  });

  test('supports checkbox keyboard selection and has no horizontal overflow at 390px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openWithEvidence(page);
    const checkbox = page.locator('input[data-evidence-id="case:0"]');
    await checkbox.focus();
    await expect(checkbox).toBeFocused();
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();
    await page.locator('#previewPortfolio').click();
    await expect(page.locator('#portfolioPreview')).toBeVisible();
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(widths.content).toBeLessThanOrEqual(widths.viewport + 2);
  });
});
