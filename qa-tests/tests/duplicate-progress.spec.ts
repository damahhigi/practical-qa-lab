
import { test, expect } from '@playwright/test';

test('reviewing unchanged test cases does not duplicate progress', async ({ page }) => {
  // 1. Open the Test Case Writing Lab
  await page.goto('/test-case-lab/');

  // 2. Create a valid test case
  await page.locator('#requirement').selectOption('REQ-03');
  await page.locator('#testType').selectOption('Boundary');

  await page.locator('#scenario').fill(
    'Verify registration rejects a password shorter than 8 characters'
  );

  await page.locator('#preconditions').fill(
    'Registration page is available'
  );

  await page.locator('#steps').fill(
    '1. Open the registration page.\n' +
    '2. Enter a seven-character password.\n' +
    '3. Submit the registration form.'
  );

  await page.locator('#testData').fill(
    'Email: learner@example.com; Password: Abcde12; ' +
    'Confirm: Abcde12; Terms: Accepted'
  );

  await page.locator('#expectedResult').fill(
    'Registration is rejected with a password-length validation error, ' +
    'and no account is created.'
  );

  await page.locator('#priority').selectOption('High');

  await page.locator('#saveCase').click();

  await expect(page.locator('#savedCount')).toHaveText('1');

  // 3. Review the test case for the first time
  await page.locator('#reviewCases').click();

  await expect(
    page.locator('#designProgressSaveStatus')
  ).toContainText('Review score saved to My Progress');

  // 4. Confirm one progress entry exists
  const firstHistory = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('practicalQaLab.progress.v1') ?? '[]')
  );

  expect(firstHistory).toHaveLength(1);
  expect(firstHistory[0].area).toBe('testcase');

  // 5. Review again without changing anything
  await page.locator('#reviewCases').click();

  await expect(
    page.locator('#designProgressSaveStatus')
  ).toContainText('already saved to My Progress');

  // 6. Confirm no duplicate progress was created
  const finalHistory = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('practicalQaLab.progress.v1') ?? '[]')
  );

  expect(finalHistory).toHaveLength(1);
  expect(finalHistory[0].id).toBe(firstHistory[0].id);
});
