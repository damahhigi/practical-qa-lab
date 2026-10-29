# Practical QA Lab — Playwright Regression Tests

This folder contains automated browser tests for the Practical QA Lab website: practice areas, interactive labs, progress and backup handling, navigation, Automation Lab modules, and the ShopFlow Capstone.

## Requirements and setup

Install Node.js, npm and Python 3. From the repository root:

```bash
cd qa-tests
npm ci
npx playwright install chromium
```

## Run the tests

```bash
# Complete suite
npx playwright test --reporter=line

# Only the ShopFlow Capstone test files
npx playwright test 'tests/automation-capstone-*.spec.ts' --reporter=line

# Visible browser / Playwright UI / HTML report
npm run test:headed
npm run test:ui
npm run test:report
```

You can also use `npm test` for the default suite. The v1.7 suite passes **206 Playwright tests** (up from 188 in v1.6 and 165 in v1.5); the count may increase as coverage grows.

### v1.7 Portfolio regression tests

Run the two v1.7 Portfolio test files separately if needed:

```bash
npx playwright test tests/portfolio-workspace-v17.spec.ts tests/portfolio-builder-v17.spec.ts --reporter=line
```

These 18 tests cover the Portfolio Workspace inventory, saved-evidence discovery, independent browser-storage sources, selection, downloadable HTML, safe handling of learner-authored text, stale-data protection, keyboard interaction and mobile layout.

## Local test server

The `playwright.config.ts` configuration:

- Uses `http://127.0.0.1:8001` as the base URL.
- Starts `python3 -m http.server 8001 --bind 127.0.0.1` from the repository root.
- Does **not** reuse an existing server; port 8001 must be available.
- Uses Playwright's Desktop Chrome configuration (Chromium).
- Retains traces and captures screenshots on test failures.

You can run a separate manual preview server on another port, such as 8002, without changing the Playwright configuration.

## Coverage

The suite includes homepage smoke tests, QA scenarios, the Test Case Writing Lab, Checkout Bug Hunt, API/SQL activities, bug triage, release readiness, four connected learning paths, the six automation modules, and ShopFlow Capstone missions. v1.6 additionally verifies independent automation-module progress and text report exports from Checkout Bug Hunt, API Bug Hunt and SQL Validation. It also checks assessment totals and reports, local progress storage, duplicates, backup export/import, keyboard navigation and selected mobile viewport behaviour.

Some tests use `@axe-core/playwright` for automated accessibility checks. These are targeted checks, not a guarantee of full WCAG compliance or coverage on every browser.

## CI

The workflow at `.github/workflows/playwright.yml` runs on pushes to `main`, pull requests into `main` and manual dispatch. It uses Node.js 24, installs dependencies and Chromium, runs Playwright and uploads an HTML report when the workflow fails.

## Safety and troubleshooting

- Playwright tests normally run in isolated browser contexts; their test `localStorage` does not touch your everyday Chrome profile.
- Deliberately seeded defects in educational bug-hunt exercises are expected scenario content, not automatically application regressions.
- If `node` or `npm` is missing, install Node.js. If `python3` is missing, install Python 3.
- If port 8001 is occupied, stop the conflicting server before testing.
- If Chromium is missing, run `npx playwright install chromium`.
- For a failed test, inspect its error, screenshot and trace before modifying source or assertions.

Generated `test-results/` and `playwright-report/` folders are ignored by Git.
