
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Test Case Lab meets automated WCAG accessibility checks', async ({ page }) => {
  // Open the Test Case Writing Lab
  await page.goto('/test-case-lab/');

  // Scan for common accessibility issues
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Display useful details if violations are found
  const findings = results.violations.map(violation => ({
    rule: violation.id,
    impact: violation.impact,
    description: violation.help,
    affectedElements: violation.nodes.map(node => node.target)
  }));

  // Fail the test if accessibility violations are detected
  expect(results.violations, JSON.stringify(findings, null, 2))
    .toEqual([]);
});

test('Homepage passes automated WCAG accessibility checks', async ({ page }) => {
  // Open the homepage
  await page.goto('/');

  // Run axe-core accessibility checks
  const results = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa'
    ])
    .analyze();

  // Collect details of any accessibility violations
  const findings = results.violations.map(violation => ({
    rule: violation.id,
    impact: violation.impact,
    description: violation.help,
    affectedElements: violation.nodes.map(node => node.target)
  }));

  // The homepage should have no detected violations
  expect(results.violations, JSON.stringify(findings, null, 2))
    .toEqual([]);
});

test('Checkout Bug Hunt passes automated WCAG accessibility checks', async ({ page }) => {
  // Open Checkout Bug Hunt
  await page.goto('/checkout-bug-hunt/');

  // Run the automated accessibility scan
  const results = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa'
    ])
    .analyze();

  // Format any violations for easier debugging
  const findings = results.violations.map(violation => ({
    rule: violation.id,
    impact: violation.impact,
    description: violation.help,
    affectedElements: violation.nodes.map(node => node.target)
  }));

  // Fail if any accessibility violations are detected
  expect(
    results.violations,
    JSON.stringify(findings, null, 2)
  ).toEqual([]);
});

test('My Progress dashboard passes automated WCAG accessibility checks', async ({ page }) => {
  // Open the homepage
  await page.goto('/');

  // Open My Progress through the quick navigation
  await page.locator('.home-quick-nav')
    .getByRole('button', { name: 'My Progress' })
    .click();

  // Confirm the dashboard is displayed
  await expect(
    page.getByRole('heading', {
      name: 'Your learning progress'
    })
  ).toBeVisible();

  // Scan the displayed dashboard
  const results = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa'
    ])
    .analyze();

  // Report any violations
  const findings = results.violations.map(violation => ({
    rule: violation.id,
    impact: violation.impact,
    description: violation.help,
    affectedElements: violation.nodes.map(node => node.target)
  }));

  expect(
    results.violations,
    JSON.stringify(findings, null, 2)
  ).toEqual([]);
});

test('Incomplete Test Case Lab form remains accessible', async ({ page }) => {
  // Open the Test Case Writing Lab
  await page.goto('/test-case-lab/');

  // Fill only some required fields
  await page.locator('#requirement').selectOption('REQ-03');

  await page.locator('#scenario').fill(
    'Verify registration rejects an invalid password'
  );

  // Attempt to save an incomplete test case
  await page.getByRole('button', {
    name: 'Save test case'
  }).click();

  const testType = page.locator('#testType');

  // The browser should focus the missing required field
  await expect(testType).toBeFocused();

  // The field must have an accessible label
  await expect(testType).toHaveAccessibleName(/Test type/);

  // Verify the browser recognizes the missing selection
  const valueMissing = await testType.evaluate(
    element => (element as HTMLSelectElement).validity.valueMissing
  );

  expect(valueMissing).toBe(true);

  // Invalid input must not create a saved test case
  await expect(page.locator('#savedCount')).toHaveText('0');

  // Scan the form in its invalid state
  const results = await new AxeBuilder({ page })
    .include('#testCaseForm')
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa'
    ])
    .analyze();

  const findings = results.violations.map(violation => ({
    rule: violation.id,
    impact: violation.impact,
    affectedElements: violation.nodes.map(node => node.target)
  }));

  expect(
    results.violations,
    JSON.stringify(findings, null, 2)
  ).toEqual([]);
});
