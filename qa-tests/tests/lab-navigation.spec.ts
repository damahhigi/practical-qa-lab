
import { test, expect } from '@playwright/test';

test('learners can navigate between both QA labs on mobile', async ({ page }) => {
  // Simulate a mobile screen
  await page.setViewportSize({
    width: 390,
    height: 844
  });

  // Start in Checkout Bug Hunt
  await page.goto('/checkout-bug-hunt/');

  const testCaseLink = page
    .locator('.challenge-header-actions')
    .getByRole('link', { name: /Test Case Lab/i });

  await expect(testCaseLink).toBeVisible();

  // Navigate to Test Case Lab
  await testCaseLink.click();

  await expect(page).toHaveURL(/\/test-case-lab\/$/);

  await expect(
    page.getByRole('heading', { name: /Test Case Writing Lab/i })
  ).toBeVisible();

  // Find the reverse navigation link
  const bugHuntLink = page
    .locator('.header-links')
    .getByRole('link', { name: /Checkout Bug Hunt/i });

  await expect(bugHuntLink).toBeVisible();

  // Return to Checkout Bug Hunt
  await bugHuntLink.click();

  await expect(page).toHaveURL(/\/checkout-bug-hunt\/$/);

  // Confirm the original lab is displayed
  await expect(
    page.getByRole('heading', { name: /Checkout Bug Hunt/i })
  ).toBeVisible();
});
