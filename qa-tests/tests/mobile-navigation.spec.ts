
import { test, expect } from '@playwright/test';

test('Start Practicing button navigates to practice cards on mobile', async ({ page }) => {
  // Set the browser to a mobile-sized viewport
  await page.setViewportSize({
    width: 390,
    height: 844
  });

  // Open the homepage
  await page.goto('/');

  // Find the Start Practicing link
  const startButton = page.getByRole('link', {
    name: 'Start Practicing'
  });

  // Verify the button is visible
  await expect(startButton).toBeVisible();

  // Click the button
  await startButton.click();

  // Verify the page navigated to the correct section
  await expect(page).toHaveURL(/#practice-areas$/);

  // Verify the practice section is visible on screen
  await expect(
    page.locator('#practice-areas')
  ).toBeInViewport();
});
