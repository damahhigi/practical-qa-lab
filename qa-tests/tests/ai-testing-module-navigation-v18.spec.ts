import { test, expect } from '@playwright/test';

const moduleOne = '/ai-testing-lab/';

test.describe('v1.8 AI Testing module navigation', () => {
  test('Module 1 header opens Module 2 and Module 2 returns to Module 1', async ({ page }) => {
    await page.goto(moduleOne);
    const navigation = page.getByRole('navigation', { name: 'Lab navigation' });
    const next = navigation.getByRole('link', { name: 'Module 2' });
    await expect(next).toHaveAttribute('href', './module-2/');
    await next.click();

    await expect(page).toHaveURL(/\/ai-testing-lab\/module-2\/?$/);
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI — Prompt Review');

    const back = page.getByRole('navigation', { name: 'AI Testing navigation' })
      .getByRole('link', { name: 'Module 1' });
    await expect(back).toHaveAttribute('href', '../');
    await back.click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/?$/);
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI Review');
  });

  test('Module 1 next-step link is clear and preserves browser storage', async ({ page }) => {
    await page.goto(moduleOne);
    await page.evaluate(() => {
      localStorage.setItem('v18-navigation-sentinel', 'keep this value');
    });
    const nextSection = page.locator('.next');
    await expect(nextSection.locator('#nextTitle')).toHaveText('Prompt & Response Testing');
    const continueLink = nextSection.getByRole('link', { name: 'Start Module 2' });
    await expect(continueLink).toHaveAttribute('href', './module-2/');
    await continueLink.click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-2\/?$/);
    const retained = await page.evaluate(() => localStorage.getItem('v18-navigation-sentinel'));
    expect(retained).toBe('keep this value');
  });

  test('forward and back links are keyboard accessible on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(moduleOne);
    const next = page.getByRole('navigation', { name: 'Lab navigation' })
      .getByRole('link', { name: 'Module 2' });
    await next.focus();
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-2\/?$/);
    const back = page.getByRole('navigation', { name: 'AI Testing navigation' })
      .getByRole('link', { name: 'Module 1' });
    await back.focus();
    await expect(back).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/ai-testing-lab\/?$/);
    const widths = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(widths.page).toBeLessThanOrEqual(widths.viewport + 2);
  });
});
