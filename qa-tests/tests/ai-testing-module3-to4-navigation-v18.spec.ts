import { test, expect } from '@playwright/test';

const MODULE3 = '/ai-testing-lab/module-3/';
const MODULE4 = '/ai-testing-lab/module-4/';

test.describe('v1.8 AI Testing — Modules 3 to 4 navigation', () => {
  test('shows accessible forward and existing backward links in Module 3', async ({ page }) => {
    await page.goto(MODULE3);

    const nav = page.getByRole('navigation', { name: 'AI Testing navigation' });
    await expect(nav.getByRole('link', { name: '← Module 2' }))
      .toHaveAttribute('href', '../module-2/');
    await expect(nav.getByRole('link', { name: 'Module 4 →' }))
      .toHaveAttribute('href', '../module-4/');
    await expect(page.locator('.next').getByRole('link', { name: 'Start Module 4 →' }))
      .toHaveAttribute('href', '../module-4/');
    await expect(page.locator('.next').getByRole('link', { name: '← Return to Module 2' }))
      .toHaveAttribute('href', '../module-2/');
  });

  test('travels from Module 3 to Module 4 and back without affecting assessments', async ({ page }) => {
    await page.goto(MODULE3);
    await expect(page.locator('#pageTitle')).toContainText('RAG Evaluation');

    await page.locator('.next').getByRole('link', { name: 'Start Module 4 →' }).click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-4\/$/);
    await expect(page.locator('#pageTitle')).toContainText('AI Safety');
    await expect(page.locator('#pageTitle')).toContainText('Privacy');

    await page.getByRole('navigation', { name: 'AI Testing navigation' })
      .getByRole('link', { name: '← Module 3' }).click();
    await expect(page).toHaveURL(/\/ai-testing-lab\/module-3\/$/);
    await expect(page.locator('#pageTitle')).toContainText('RAG Evaluation');
  });

  test('supports mobile keyboard navigation and does not alter saved progress', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(MODULE3);

    const savedProgress = JSON.stringify({ version: 1, sessions: [{ id: 'keep-me' }] });
    await page.evaluate(value => {
      localStorage.setItem('practicalQaLab.progress.v1', value);
    }, savedProgress);

    const forward = page.locator('.next').getByRole('link', { name: 'Start Module 4 →' });
    await forward.focus();
    await expect(forward).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/ai-testing-lab\/module-4\/$/);
    await expect(page.locator('#pageTitle')).toContainText('AI Safety');
    const after = await page.evaluate(() => localStorage.getItem('practicalQaLab.progress.v1'));
    expect(after).toBe(savedProgress);
  });
});
