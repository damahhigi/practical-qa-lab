import { test, expect } from '@playwright/test';

test.describe('Automation Lab homepage integration', () => {

  test('homepage opens the Automation Learning Path', async ({ page }) => {
    await page.goto('/');

    const card = page.locator(
      'section[aria-labelledby="automation-lab-title"]'
    );

    await expect(card).toBeVisible();

    await expect(card.getByRole('heading', {
      name: 'Test Automation Lab'
    })).toBeVisible();

    // Existing homepage functionality must remain accessible.
    await expect(page.getByRole('button', {
      name: 'My Progress',
      exact: true
    })).toBeVisible();

    // Open the learning pathway through the new homepage card.
    await card.getByRole('link', {
      name: 'Open Test Automation Learning Path'
    }).click();

    await expect(page).toHaveURL(
      /\/automation-lab\/learning-path\/$/
    );

    // The learning pathway must offer all six modules.
    const moduleNames = [
      'Playwright Fundamentals',
      'Locators & Interactions',
      'Assertions & Validation',
      'Negative & Boundary Testing',
      'Debugging Flaky Tests',
      'API Automation'
    ];

    for (const name of moduleNames) {
      await expect(page.getByRole('link', {
        name: new RegExp(name, 'i')
      })).toBeVisible();
    }
  });

});
