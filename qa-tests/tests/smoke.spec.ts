import { test, expect } from '@playwright/test';

test.describe('Practical QA Lab smoke regression', () => {
  test('homepage shows the hands-on labs and 13-area dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Practical QA Lab', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Bug Hunt/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start Test Case Lab/ })).toBeVisible();

    await page.getByRole('button', { name: /View my progress/ }).first().click();
    await expect(page.locator('#progressAreas')).toHaveText('0/13');
    await expect(page.locator('#progressSessions')).toHaveText('0');
  });

  test('Checkout Bug Hunt calculates the simple Notebook baseline correctly', async ({ page }) => {
    await page.goto('/checkout-bug-hunt/');
    await page.locator('[data-add="notebook"]').click();
    await expect(page.locator('#subtotal')).toHaveText('KES 1,000');
    await expect(page.locator('#discount')).toHaveText('KES 0');
    await expect(page.locator('#shipping')).toHaveText('KES 250');
    await expect(page.locator('#grandTotal')).toHaveText('KES 1,250');
  });

  test('Test Case Lab saves a draft, preserves it after refresh, and records review progress', async ({ page }) => {
    await page.goto('/test-case-lab/');
    await page.locator('#requirement').selectOption('REQ-03');
    await page.locator('#testType').selectOption('Boundary');
    await page.locator('#scenario').fill('Reject a password with only seven characters');
    await page.locator('#preconditions').fill('Registration page is available');
    await page.locator('#steps').fill('1. Open registration.\n2. Enter the test data.\n3. Submit the form.');
    await page.locator('#testData').fill('Email: tester@example.com; Password: Abcde12; Confirm: Abcde12; Terms: accepted');
    await page.locator('#expectedResult').fill('A password length error appears and no account is created.');
    await page.locator('#priority').selectOption('High');

    await page.getByRole('button', { name: 'Save test case' }).click();
    await expect(page.locator('#savedCount')).toHaveText('1');
    await expect(page.locator('#caseList')).toContainText('TC-001');

    await page.reload();
    await expect(page.locator('#savedCount')).toHaveText('1');
    await expect(page.locator('#caseList')).toContainText('Reject a password with only seven characters');

    await page.locator('#reviewCases').click();
    await expect(page.locator('#reviewResults')).toBeVisible();
    await page.getByRole('link', { name: /Main Practical QA Lab/ }).click();
    await page.getByRole('button', { name: /View my progress/ }).first().click();
    await expect(page.locator('#progressAreas')).toHaveText('1/13');
    await expect(page.locator('#progressSessions')).toHaveText('1');
  });
});
