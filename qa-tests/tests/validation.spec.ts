
import { test, expect } from '@playwright/test';

test('incomplete test case cannot be saved', async ({ page }) => {
  // Open the Test Case Writing Lab
  await page.goto('/test-case-lab/');

  // Select a requirement
  await page.locator('#requirement').selectOption('REQ-03');

  // Enter a scenario but leave required fields incomplete
  await page.locator('#scenario').fill(
    'Verify registration rejects an invalid password'
  );

  // Attempt to save
  await page.getByRole('button', {
    name: 'Save test case'
  }).click();

  // The missing test type should receive focus
  await expect(page.locator('#testType')).toBeFocused();

  // No test case should have been saved
  await expect(page.locator('#savedCount')).toHaveText('0');

  // The next available ID should remain TC-001
  await expect(page.locator('#formCaseId')).toHaveText('TC-001');
});
