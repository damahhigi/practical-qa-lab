import { test, expect } from '@playwright/test';

const M4 = '/ai-testing-lab/module-4/';
const M5 = '/ai-testing-lab/module-5/';

test.describe('v1.8 AI Testing — Modules 4 to 5 navigation', () => {
  test('shows forward links while retaining Module 3 links', async ({ page }) => {
    await page.goto(M4);
    const navigation = page.getByRole('navigation', { name: 'AI Testing navigation' });
    await expect(navigation.getByRole('link', { name: '← Module 3' }))
      .toHaveAttribute('href', '../module-3/');
    await expect(navigation.getByRole('link', { name: 'Module 5 →' }))
      .toHaveAttribute('href', '../module-5/');
    await expect(page.locator('.next').getByRole('link', { name: 'Start Module 5 →' }))
      .toHaveAttribute('href', '../module-5/');
    await expect(page.locator('.next').getByRole('link', { name: '← Return to Module 3' }))
      .toHaveAttribute('href', '../module-3/');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
  });

  test('opens Module 5 and returns to Module 4', async ({ page }) => {
    await page.goto(M4);
    await page.locator('.next').getByRole('link', { name: 'Start Module 5 →' }).click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-5\/$/);
    await expect(page.locator('#pageTitle')).toContainText('Bias, Fairness');
    await expect(page.locator('#pageTitle')).toContainText('Multilingual AI Testing');
    await page.getByRole('navigation', { name: 'AI Testing navigation' })
      .getByRole('link', { name: '← Module 4' }).click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-4\/$/);
    await expect(page.locator('#pageTitle')).toContainText('AI Safety');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
  });

  test('supports mobile keyboard navigation without altering browser progress', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(M4);
    const stored = JSON.stringify({ version: 1, sessions: [{ id: 'preserve-m4-to-m5' }] });
    await page.evaluate(value => localStorage.setItem('practicalQaLab.progress.v1', value), stored);
    const link = page.locator('.next').getByRole('link', { name: 'Start Module 5 →' });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-5\/$/);
    await expect(page.locator('#pageTitle')).toContainText('Bias, Fairness');
    const after = await page.evaluate(() => localStorage.getItem('practicalQaLab.progress.v1'));
    expect(after).toBe(stored);
    const widths = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(widths.content).toBeLessThanOrEqual(widths.viewport + 2);
  });
});
