import { test, expect } from '@playwright/test';

const MODULE_TWO = '/ai-testing-lab/module-2/';

// These tests check navigation only; the exercises remain fictional, browser-local simulations.
test.describe('v1.8 AI Testing navigation — Modules 2 and 3', () => {
  test('Module 2 header opens Module 3, and Module 3 returns to Module 2', async ({ page }) => {
    await page.goto(MODULE_TWO);
    const nav = page.getByRole('navigation', { name: 'AI Testing navigation' });
    const next = nav.getByRole('link', { name: 'Module 3' });
    await expect(next).toHaveAttribute('href', '../module-3/');
    // Keep the previous Module 2 navigation contract: Portfolio Workspace is the last link.
    await expect(nav.getByRole('link').last()).toHaveAttribute('href', '../../portfolio/');
    await next.click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-3\/?$/);
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI — RAG Evidence Review');
    const back = page.getByRole('navigation', { name: 'AI Testing navigation' })
      .getByRole('link', { name: 'Module 2' });
    await expect(back).toHaveAttribute('href', '../module-2/');
    await back.click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-2\/?$/);
    await expect(page.locator('#practiceTitle')).toHaveText('Assist AI — Prompt Review');
  });

  test('Module 2 next-step link opens Module 3 without changing browser storage', async ({ page }) => {
    await page.goto(MODULE_TWO);
    await page.evaluate(() => {
      localStorage.setItem('v18-modules-2-3-sentinel', 'keep this value');
    });
    await expect(page.locator('.next #nextTitle')).toHaveText('Hallucinations & RAG Evaluation');
    const continueLink = page.locator('.next').getByRole('link', { name: 'Start Module 3' });
    await expect(continueLink).toHaveAttribute('href', '../module-3/');
    await continueLink.click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-3\/?$/);
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    expect(await page.evaluate(() => localStorage.getItem('v18-modules-2-3-sentinel')))
      .toBe('keep this value');
  });

  test('forward and back links work with keyboard on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MODULE_TWO);
    const next = page.getByRole('navigation', { name: 'AI Testing navigation' })
      .getByRole('link', { name: 'Module 3' });
    await next.focus();
    await expect(next).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-3\/?$/);
    const back = page.getByRole('navigation', { name: 'AI Testing navigation' })
      .getByRole('link', { name: 'Module 2' });
    await back.focus();
    await expect(back).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-2\/?$/);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 2);
  });
});
