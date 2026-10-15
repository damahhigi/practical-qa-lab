
import { test, expect } from '@playwright/test';

test('mobile quick navigation works correctly', async ({ page }) => {
  // Simulate a mobile screen
  await page.setViewportSize({
    width: 390,
    height: 844
  });

  // Open the homepage
  await page.goto('/');

  const navigation = page.locator('.home-quick-nav');

  // Verify the navigation is visible
  await expect(navigation).toBeVisible();

  // Verify the Bug Hunt link
  await expect(
    navigation.getByRole('link', { name: 'Bug Hunt' })
  ).toHaveAttribute('href', 'checkout-bug-hunt/');

  // Verify the Test Case Lab link
  await expect(
    navigation.getByRole('link', { name: 'Test Case Lab' })
  ).toHaveAttribute('href', 'test-case-lab/');

  // Verify My Progress is available
  const progressButton = navigation.getByRole('button', {
    name: 'My Progress'
  });

  await expect(progressButton).toBeVisible();

  // Ensure the duplicate Practice Areas link is removed
  await expect(
    navigation.getByRole('link', { name: 'Practice Areas' })
  ).toHaveCount(0);

  // Open the learning dashboard
  await progressButton.click();

  // Verify the dashboard opens
  await expect(
    page.getByRole('heading', {
      name: 'Your learning progress'
    })
  ).toBeVisible();

  // Start Practicing must not appear on the dashboard
  await expect(
    page.locator('.hero-practice-link')
  ).toBeHidden();
});
