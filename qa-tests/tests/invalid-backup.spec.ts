
import { test, expect } from '@playwright/test';

test('invalid backup cannot overwrite saved test cases', async ({ page }) => {
  await page.goto('/test-case-lab/');

  // Create a valid test case first
  await page.locator('#requirement').selectOption('REQ-03');
  await page.locator('#testType').selectOption('Boundary');

  await page.locator('#scenario').fill(
    'Reject a password shorter than eight characters'
  );

  await page.locator('#steps').fill(
    '1. Open registration.\n2. Enter Abcde12.\n3. Submit.'
  );

  await page.locator('#testData').fill(
    'Password: Abcde12; Confirmation: Abcde12'
  );

  await page.locator('#expectedResult').fill(
    'Registration is rejected and a validation error appears.'
  );

  await page.locator('#priority').selectOption('High');
  await page.locator('#saveCase').click();

  await expect(page.locator('#savedCount')).toHaveText('1');

  // Capture the saved data before attempting import
  const before = await page.evaluate(() =>
    localStorage.getItem('pqa_test_case_lab_stage2_v1')
  );

  expect(before).not.toBeNull();

  // Upload an unsupported backup
  await page.locator('#draftBackupFile').setInputFiles(
    'tests/fixtures/invalid-testcases.json'
  );

  // Verify that the application rejects it
  await expect(page.locator('#draftImportPreview'))
    .toContainText('Unsupported Test Case Lab backup');

  await expect(page.locator('#importDrafts')).toBeDisabled();

  // Verify that saved data was not changed
  const after = await page.evaluate(() =>
    localStorage.getItem('pqa_test_case_lab_stage2_v1')
  );

  expect(after).toBe(before);

  // Verify the saved test case survives a refresh
  await page.reload();

  await expect(page.locator('#savedCount')).toHaveText('1');
  await expect(page.locator('#caseList')).toContainText('TC-001');
});
