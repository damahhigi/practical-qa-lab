
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
