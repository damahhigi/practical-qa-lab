
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
