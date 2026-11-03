import { test, expect } from '@playwright/test';

const M6 = '/ai-testing-lab/module-6/';
const CAPSTONE = '/ai-testing-lab/capstone/';

test.describe('v1.8 AI Testing — Module 6 to Capstone navigation', () => {
  test('shows two Capstone links while keeping Module 5 navigation', async ({ page }) => {
    await page.goto(M6);
    const navigation = page.getByRole('navigation', { name: 'AI Testing navigation' });
    await expect(navigation.getByRole('link', { name: '← Module 5' }))
      .toHaveAttribute('href', '../module-5/');
    await expect(navigation.getByRole('link', { name: 'AI Testing Capstone →' }))
      .toHaveAttribute('href', '../capstone/');
    await expect(page.locator('.next').getByRole('link', { name: 'Start AI Testing Capstone →' }))
      .toHaveAttribute('href', '../capstone/');
    await expect(page.locator('.next').getByRole('link', { name: '← Return to Module 5' }))
      .toHaveAttribute('href', '../module-5/');
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
  });

  test('opens Capstone and returns to Module 6', async ({ page }) => {
    await page.goto(M6);
    await page.locator('.next').getByRole('link', { name: 'Start AI Testing Capstone →' }).click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/capstone\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Assist AI');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Release Assessment');
    await expect(page.locator('#missionList article.mission')).toHaveCount(6);
    await page.getByRole('navigation', { name: 'AI Testing navigation' })
      .getByRole('link', { name: '← Module 6' }).click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-6\/$/);
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
  });

  test('supports keyboard and mobile navigation without modifying learner progress', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(M6);
    const key = 'practicalQaLab.progress.v1';
    const original = JSON.stringify({ version: 1, sessions: [{ id: 'preserve-v18-nav' }] });
    await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
      key, value: original,
    });
    const link = page.locator('.next').getByRole('link', { name: 'Start AI Testing Capstone →' });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/ai-testing-lab\/capstone\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Release Assessment');
    const after = await page.evaluate(key => localStorage.getItem(key), key);
    expect(after).toBe(original);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 2);
  });
});
