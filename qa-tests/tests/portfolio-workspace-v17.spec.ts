import { test, expect, type Page } from '@playwright/test';

const keys = {
  cases: 'pqa_test_case_lab_stage2_v1',
  checkout: 'practicalQaLabCheckoutReportsV1',
  api: 'pqa_api_bug_hunt_reports_v1',
  sql: 'practical-qa-sql-validation-reports-v1',
  progress: 'practicalQaLab.progress.v1',
};

const exampleStorage: Record<string, unknown> = {
  [keys.cases]: {
    version: 1,
    nextSequence: 3,
    cases: [
      { id: 'TC-001', scenario: 'Password length boundary' },
      { id: 'TC-002', scenario: 'Valid registration' },
    ],
  },
  [keys.checkout]: [
    { id: 'BUG-001', title: 'Incorrect cart subtotal' },
    { id: 'BUG-002', title: 'Discount ignored' },
    { id: 'BUG-003', title: 'Shipping threshold' },
  ],
  [keys.api]: {
    format: 'pqa-api-bug-hunt-reports',
    version: 1,
    reports: [{ id: 'API-001', title: 'Missing Location header' }],
  },
  [keys.sql]: {
    version: 1,
    reports: [{ id: 'SQL-001', title: 'Duplicate email' }],
  },
  [keys.progress]: [
    { id: 'p1', type: 'practice', area: 'manual' },
    { id: 'p2', type: 'challenge', area: 'sqlvalidation' },
    { id: 'p3', type: 'practice', area: 'automation' },
    { id: 'p4', type: 'challenge', area: 'checkout' },
  ],
};

async function seedLocalEvidence(page: Page) {
  // Playwright uses an isolated browser context, not the user's Chrome profile.
  await page.goto('/');
  await page.evaluate((fixtures) => {
    for (const [key, value] of Object.entries(fixtures)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, exampleStorage);
  await page.goto('/portfolio/');
}

async function readOriginalStorage(page: Page) {
  return page.evaluate((names) => Object.fromEntries(
    Object.values(names).map(key => [key, localStorage.getItem(key)])
  ), keys);
}

test.describe('v1.7 Portfolio Workspace — navigation and read-only inventory', () => {
  test('homepage quick navigation opens the Portfolio Workspace', async ({ page }) => {
    await page.goto('/');
    const navigation = page.getByRole('navigation', { name: 'Quick navigation' });
    const portfolioLink = navigation.getByRole('link', { name: 'Portfolio Workspace' });
    await expect(portfolioLink).toBeVisible();
    await expect(portfolioLink).toHaveAttribute('href', 'portfolio/');
    await expect(navigation.locator('a')).toHaveCount(6);
    await portfolioLink.click();
    await expect(page).toHaveURL(/\/portfolio\/$/);
    await expect(page.getByRole('heading', { name: 'Your QA work, in one place.' })).toBeVisible();
  });

  test('empty inventory reports zero for all five evidence sources', async ({ page }) => {
    await page.goto('/portfolio/');
    for (const id of ['caseCount', 'checkoutCount', 'apiCount', 'sqlCount', 'progressCount']) {
      await expect(page.locator(`#${id}`)).toHaveText('0');
    }
    await expect(page.locator('#inventoryStatus'))
      .toHaveText('5 of 5 sources checked. Read-only scan complete.');
    await expect(page.locator('.evidence-card')).toHaveCount(5);
  });

  test('counts all five saved evidence types using existing storage formats', async ({ page }) => {
    await seedLocalEvidence(page);
    const expected: Record<string, string> = {
      caseCount: '2', checkoutCount: '3', apiCount: '1',
      sqlCount: '1', progressCount: '4',
    };
    for (const [id, count] of Object.entries(expected)) {
      await expect(page.locator(`#${id}`)).toHaveText(count);
    }
    await expect(page.locator('#inventoryStatus'))
      .toContainText('5 of 5 sources checked');
  });

  test('refresh updates displayed counts without modifying saved evidence', async ({ page }) => {
    await seedLocalEvidence(page);
    const before = await readOriginalStorage(page);
    await page.getByRole('button', { name: 'Refresh counts' }).click();
    expect(await readOriginalStorage(page)).toEqual(before);

    await page.evaluate((key) => {
      const saved = JSON.parse(localStorage.getItem(key) ?? '[]');
      saved.push({ id: 'BUG-004', title: 'Quantity not reflected in total' });
      localStorage.setItem(key, JSON.stringify(saved));
    }, keys.checkout);
    await expect(page.locator('#checkoutCount')).toHaveText('3');
    const withNewReport = await readOriginalStorage(page);
    await page.getByRole('button', { name: 'Refresh counts' }).click();
    await expect(page.locator('#checkoutCount')).toHaveText('4');
    expect(await readOriginalStorage(page)).toEqual(withNewReport);
  });

  test('invalid or unreadable saved data is not overwritten', async ({ page }) => {
    await page.goto('/');
    await page.evaluate((names) => {
      localStorage.setItem(names.api, JSON.stringify({ unexpected: true }));
      localStorage.setItem(names.sql, '{invalid json');
    }, keys);
    await page.goto('/portfolio/');
    await expect(page.locator('#apiCount')).toHaveText('—');
    await expect(page.locator('#sqlCount')).toHaveText('—');
    await expect(page.locator('#inventoryStatus')).toContainText('2 unavailable or unrecognized');
    await expect(page.locator('#apiNote')).toContainText('nothing was changed');
    await expect(page.locator('#sqlNote')).toContainText('Nothing was changed');
    const after = await page.evaluate(names => ({
      api: localStorage.getItem(names.api),
      sql: localStorage.getItem(names.sql),
    }), keys);
    expect(after.api).toBe(JSON.stringify({ unexpected: true }));
    expect(after.sql).toBe('{invalid json');
  });

  test('links route to the existing labs and the homepage', async ({ page }) => {
    await page.goto('/portfolio/');
    const links = page.locator('.evidence-card .card-link');
    await expect(links).toHaveCount(5);
    const expected = [
      '../test-case-lab/', '../checkout-bug-hunt/',
      '../api-bug-hunt/', '../sql-validation-lab/', '../',
    ];
    for (let i = 0; i < expected.length; i++) {
      await expect(links.nth(i)).toHaveAttribute('href', expected[i]);
    }
    await page.getByRole('link', { name: /Back to main lab/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Practical QA Lab', exact: true })).toBeVisible();
  });

  test('the homepage Portfolio link works by keyboard on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const link = page.getByRole('navigation', { name: 'Quick navigation' })
      .getByRole('link', { name: 'Portfolio Workspace' });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/portfolio\/$/);
    await expect(page.locator('.evidence-card')).toHaveCount(5);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 2);
  });

  test('unavailable browser storage is reported without breaking the page', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.getItem = function () {
        throw new Error('Test-only: storage blocked');
      };
    });
    await page.goto('/portfolio/');
    await expect(page.locator('#inventoryStatus')).toContainText('5 unavailable or unrecognized');
    await expect(page.locator('#caseCount')).toHaveText('—');
    await expect(page.locator('#checkoutCount')).toHaveText('—');
    await expect(page.getByRole('button', { name: 'Refresh counts' })).toBeEnabled();
  });
});
