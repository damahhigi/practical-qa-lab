import { test, expect } from '@playwright/test';

test.describe('v1.8 AI Testing — homepage navigation', () => {
  test('homepage link opens the six-case Assist AI Review lab', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Quick navigation' });
    const link = nav.getByRole('link', { name: 'AI Testing Lab' });
    await expect(nav.getByRole('link')).toHaveCount(7);
    await expect(link).toHaveAttribute('href', 'ai-testing-lab/');
    await link.click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/$/);
    await expect(page.getByRole('heading', { name: 'Assist AI Review' })).toBeVisible();
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
  });

  test('mobile homepage link supports keyboard navigation without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Quick navigation' });
    const link = nav.getByRole('link', { name: 'AI Testing Lab' });
    await expect(nav.getByRole('button', { name: 'My Progress' })).toBeVisible();
    await expect(link).toBeVisible();
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/ai-testing-lab\/$/);
    await expect(page.locator('#caseList article.case')).toHaveCount(6);
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(sizes.page).toBeLessThanOrEqual(sizes.viewport + 2);
  });

  test('homepage quick navigation stays evenly arranged and preserves Portfolio and My Progress', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Quick navigation' });
    await expect(nav.getByRole('link', { name: 'Portfolio Workspace' }))
      .toHaveAttribute('href', 'portfolio/');
    await expect(nav.getByRole('button', { name: 'My Progress' })).toBeVisible();
    await expect(nav.getByRole('link')).toHaveCount(7);
    const desktopCols = await nav.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(desktopCols).toBe(4);
    await page.setViewportSize({ width: 390, height: 844 });
    const mobileCols = await nav.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
    expect(mobileCols).toBe(2);
  });
});
