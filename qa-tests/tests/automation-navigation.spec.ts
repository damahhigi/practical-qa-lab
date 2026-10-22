import { test, expect } from '@playwright/test';

const modules = [
  {
    path: '/automation-lab/',
    destinations: [
      '/automation-lab/learning-path/',
      '/automation-lab/module-2/'
    ]
  },
  {
    path: '/automation-lab/module-2/',
    destinations: [
      '/automation-lab/',
      '/automation-lab/learning-path/',
      '/automation-lab/module-3/'
    ]
  },
  {
    path: '/automation-lab/module-3/',
    destinations: [
      '/automation-lab/module-2/',
      '/automation-lab/learning-path/',
      '/automation-lab/module-4/'
    ]
  },
  {
    path: '/automation-lab/module-4/',
    destinations: [
      '/automation-lab/module-3/',
      '/automation-lab/learning-path/',
      '/automation-lab/module-5/'
    ]
  },
  {
    path: '/automation-lab/module-5/',
    destinations: [
      '/automation-lab/module-4/',
      '/automation-lab/learning-path/',
      '/automation-lab/module-6/'
    ]
  },
  {
    path: '/automation-lab/module-6/',
    destinations: [
      '/automation-lab/module-5/',
      '/automation-lab/learning-path/'
    ]
  }
];

test.describe('Automation Lab navigation', () => {

  modules.forEach((module, index) => {
    test(`Module ${index + 1} navigation links work`, async ({ page }) => {
      await page.goto(module.path);

      const links = page.locator('.module-route-links a');

      await expect(links)
        .toHaveCount(module.destinations.length);

      for (let i = 0; i < module.destinations.length; i++) {
        await links.nth(i).click();

        expect(new URL(page.url()).pathname)
          .toBe(module.destinations[i]);

        // Return before testing the next link.
        await page.goto(module.path);
      }
    });
  });

  test('saved answers survive navigation between modules', async ({ page }) => {
    await page.goto('/automation-lab/module-3/');

    await page.locator('#visibleChoice')
      .selectOption('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await page.locator('.module-route-links .next').click();

    await expect(page)
      .toHaveURL(/\/automation-lab\/module-4\/$/);

    await page.getByRole('link', {
      name: /Previous: Assertions & Validation/
    }).click();

    await expect(page)
      .toHaveURL(/\/automation-lab\/module-3\/$/);

    await expect(page.locator('#visibleChoice'))
      .toHaveValue('correct');

    await expect(page.locator('#completedCount'))
      .toHaveText('1/4');

    await expect(page.locator('#draftStatus'))
      .toContainText('Draft restored from this browser');
  });

});
