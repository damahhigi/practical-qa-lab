
import { test, expect } from '@playwright/test';

test('valid test case backup restores deleted work', async ({ page }, testInfo) => {
  // Open Test Case Lab
  await page.goto('/test-case-lab/');

  // Create a sample test case
  await page.locator('#requirement').selectOption('REQ-03');
  await page.locator('#testType').selectOption('Boundary');

  await page.locator('#scenario').fill(
    'Verify registration rejects a seven-character password'
  );

  await page.locator('#preconditions').fill(
    'Registration page is available'
  );

  await page.locator('#steps').fill(
    '1. Open registration.\n' +
    '2. Enter a seven-character password.\n' +
    '3. Submit registration.'
  );

  await page.locator('#testData').fill(
    'Email: learner@example.com; Password: Abcde12; Terms: Accepted'
  );

  await page.locator('#expectedResult').fill(
    'Registration is rejected with a password-length error.'
  );

  await page.locator('#priority').selectOption('High');
  await page.locator('#saveCase').click();

  await expect(page.locator('#savedCount')).toHaveText('1');

  // Record the original saved data
  const originalData = await page.evaluate(() =>
    localStorage.getItem('pqa_test_case_lab_stage2_v1')
  );

  expect(originalData).not.toBeNull();

  // Download the real JSON backup
  const downloadPromise = page.waitForEvent('download');

  await page.locator('#exportDrafts').click();

  const download = await downloadPromise;

  const backupPath = testInfo.outputPath(
    download.suggestedFilename()
  );

  await download.saveAs(backupPath);

  // Delete the saved test case
  page.once('dialog', dialog => dialog.accept());

  await page.locator(
    '#caseList button[data-action="delete"]'
  ).click();

  await expect(page.locator('#savedCount')).toHaveText('0');

  // Upload the exported backup
  await page.locator('#draftBackupFile')
    .setInputFiles(backupPath);

  // Select Replace mode
  await page.locator(
    'input[name="draftImportMode"][value="replace"]'
  ).check();

  // Verify the import preview
  await expect(page.locator('#draftImportPreview'))
    .toContainText('Ready to replace');

  await expect(page.locator('#importDrafts')).toBeEnabled();

  // Confirm restoration
  page.once('dialog', dialog => dialog.accept());

  await page.locator('#importDrafts').click();

  // Verify the test case was restored
  await expect(page.locator('#savedCount')).toHaveText('1');

  await expect(page.locator('#caseList'))
    .toContainText('TC-001');

  await expect(page.locator('#caseList'))
    .toContainText('Verify registration rejects a seven-character password');

  // Compare all restored data with the original
  const restoredData = await page.evaluate(() =>
    localStorage.getItem('pqa_test_case_lab_stage2_v1')
  );

  expect(restoredData).toBe(originalData);

  // Check persistence after refresh
  await page.reload();

  await expect(page.locator('#savedCount')).toHaveText('1');
  await expect(page.locator('#formCaseId')).toHaveText('TC-002');

  const dataAfterRefresh = await page.evaluate(() =>
    localStorage.getItem('pqa_test_case_lab_stage2_v1')
  );

  expect(dataAfterRefresh).toBe(originalData);
});
