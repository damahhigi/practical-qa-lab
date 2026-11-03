import { test, expect } from '@playwright/test';

const M5 = '/ai-testing-lab/module-5/';
const M6 = '/ai-testing-lab/module-6/';

// Uses Playwright's isolated browser context; never changes the learner's browser profile.
test.describe('v1.8 AI Testing — Modules 5 to 6 navigation', () => {
  test('shows two forward links and preserves the Module 4 links', async ({ page }) => {
    await page.goto(M5);
    const navigation = page.getByRole('navigation', { name: 'AI Testing navigation' });
    await expect(navigation.getByRole('link', { name: '← Module 4' }))
      .toHaveAttribute('href', '../module-4/');
    await expect(navigation.getByRole('link', { name: 'Module 6 →' }))
      .toHaveAttribute('href', '../module-6/');
    await expect(page.locator('.next').getByRole('link', { name: 'Start Module 6 →' }))
      .toHaveAttribute('href', '../module-6/');
    await expect(page.locator('.next').getByRole('link', { name: '← Return to Module 4' }))
      .toHaveAttribute('href', '../module-4/');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
  });

  test('opens Module 6 and returns to Module 5', async ({ page }) => {
    await page.goto(M5);
    await page.locator('.next').getByRole('link', { name: 'Start Module 6 →' }).click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-6\/$/);
    await expect(page.locator('#pageTitle')).toContainText('Evaluation Datasets');
    await expect(page.locator('#pageTitle')).toContainText('Quality Metrics');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    await page.getByRole('navigation', { name: 'AI Testing navigation' })
      .getByRole('link', { name: '← Module 5' }).click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-5\/$/);
    await expect(page.locator('#pageTitle')).toContainText('Bias, Fairness');
    await expect(page.locator('#pageTitle')).toContainText('Multilingual AI Testing');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
  });

  test('supports keyboard/mobile navigation without modifying saved progress', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(M5);
    const progressKey = 'practicalQaLab.progress.v1';
    const stored = JSON.stringify({ version: 1, sessions: [{ id: 'preserve-m5-to-m6' }] });
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key: progressKey, value: stored,
    });
    const link = page.locator('.next').getByRole('link', { name: 'Start Module 6 →' });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-6\/$/);
    await expect(page.locator('#pageTitle')).toContainText('Quality Metrics');
    const after = await page.evaluate(key => localStorage.getItem(key), progressKey);
    expect(after).toBe(stored);
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(widths.content).toBeLessThanOrEqual(widths.viewport + 2);
  });
});
