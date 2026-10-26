import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const capstonePath = '/automation-lab/capstone/';
const progressKey = 'practicalQaLab.progress.v1';

const answers: Array<Array<[string, string]>> = [
  [
    ['capstoneM1Smoke', 'journey'],
    ['capstoneM1Email', 'invalid-email'],
    ['capstoneM1Release', 'block-and-retest']
  ],
  [
    ['capstoneM2Product', 'role'],
    ['capstoneM2Cart', 'role'],
    ['capstoneM2Quantity', 'label'],
    ['capstoneM2Subtotal', 'subtotal']
  ],
  [
    ['capstoneM3Heading', 'heading'],
    ['capstoneM3Price', 'price'],
    ['capstoneM3Quantity', 'value'],
    ['capstoneM3Subtotal', 'subtotal']
  ],
  [
    ['capstoneM4Boundaries', 'edges'],
    ['capstoneM4CartState', 'unchanged'],
    ['capstoneM4Email', 'both']
  ],
  [
    ['capstoneM5Waiting', 'retry-assertion'],
    ['capstoneM5Locator', 'scoped-role'],
    ['capstoneM5Isolation', 'isolated-state']
  ],
  [
    ['capstoneM6Request', 'get'],
    ['capstoneM6Contract', 'contract'],
    ['capstoneM6Missing', 'not-found']
  ]
];

async function reviewAllMissions(page: Page) {
  for (const [index, decisions] of answers.entries()) {
    for (const [id, value] of decisions) {
      await page.locator('#' + id).selectOption(value);
    }

    const number = index + 1;

    await page.locator(
      `#capstoneM${number}Review`
    ).click();

    await expect(
      page.locator(`#capstoneM${number}Result`)
    ).toBeVisible();
  }
}

async function calculateSummary(page: Page) {
  await page.locator('#capstoneSummaryReview').click();
}

async function generateReport(page: Page) {
  await page.locator('#capstoneReportGenerate').click();
}

async function completeFullAssessment(page: Page) {
  await reviewAllMissions(page);
  await calculateSummary(page);

  await expect(page.locator('#capstoneSummaryScore'))
    .toHaveText('100/100');

  await generateReport(page);

  await expect(page.locator('#capstoneReportResult'))
    .toBeVisible();
}

test.describe('v1.5 Capstone - Assessment Report', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(capstonePath);
  });

  test('requires a completed combined score', async ({ page }) => {
    await expect(
      page.getByRole('heading', {
        name: 'ShopFlow QA Assessment Report'
      })
    ).toBeVisible();

    await generateReport(page);

    await expect(page.locator('#capstoneReportResult'))
      .toBeHidden();

    await expect(page.locator('#capstoneReportStatus'))
      .toContainText(
        'calculate your combined Capstone score'
      );

    // Even reviewed missions are insufficient
    // until the combined score is calculated.
    await reviewAllMissions(page);

    await generateReport(page);

    await expect(page.locator('#capstoneReportResult'))
      .toBeHidden();

    await calculateSummary(page);
    await generateReport(page);

    await expect(page.locator('#capstoneReportResult'))
      .toBeVisible();
  });

  test('generates a complete 100-point practice report', async ({ page }) => {
    await completeFullAssessment(page);

    await expect(page.locator('#capstoneReportScore'))
      .toHaveText('100/100');

    await expect(
      page.locator('#capstoneReportBreakdown li')
    ).toHaveCount(6);

    await expect(
      page.locator('#capstoneReportStrengths li')
    ).toHaveCount(6);

    await expect(
      page.locator('#capstoneReportImprovements li')
    ).toHaveCount(1);

    await expect(
      page.locator('#capstoneReportImprovements')
    ).toContainText('No gaps were identified');

    await expect(
      page.locator('#capstoneReportCoverage li')
    ).toHaveCount(7);

    for (let number = 1; number <= 7; number++) {
      const id = `AC-${String(number).padStart(2, '0')}`;

      await expect(
        page.locator('#capstoneReportCoverage')
      ).toContainText(id);
    }

    await expect(
      page.locator('#capstoneReportReadiness')
    ).toContainText('UNDETERMINED');

    await expect(
      page.locator('#capstoneReportReadiness')
    ).toContainText('does not execute tests');

    // Generating again must not duplicate report items.
    await generateReport(page);

    await expect(
      page.locator('#capstoneReportBreakdown li')
    ).toHaveCount(6);

    await expect(
      page.locator('#capstoneReportCoverage li')
    ).toHaveCount(7);
  });

  test('identifies a lower-scoring mission for improvement', async ({ page }) => {
    await reviewAllMissions(page);

    // One incorrect API decision costs five points.
    await page.locator('#capstoneM6Request')
      .selectOption('post');

    await page.locator('#capstoneM6Review').click();

    await expect(page.locator('#capstoneM6Score'))
      .toHaveText('10/15');

    await calculateSummary(page);

    await expect(page.locator('#capstoneSummaryScore'))
      .toHaveText('95/100');

    await generateReport(page);

    await expect(page.locator('#capstoneReportScore'))
      .toHaveText('95/100');

    await expect(
      page.locator('#capstoneReportStrengths li')
    ).toHaveCount(5);

    await expect(
      page.locator('#capstoneReportImprovements li')
    ).toHaveCount(1);

    await expect(
      page.locator('#capstoneReportImprovements')
    ).toContainText('API Contract Validation (10/15)');

    await expect(
      page.locator('#capstoneReportImprovements')
    ).toContainText('Practise GET requests');

    // A high simulated score is not real release approval.
    await expect(
      page.locator('#capstoneReportReadiness')
    ).toContainText('UNDETERMINED');
  });

  test('invalidates reports when assessment answers change', async ({ page }) => {
    await completeFullAssessment(page);

    await page.locator('#capstoneM3Heading')
      .selectOption('url');

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();

    await expect(page.locator('#capstoneReportResult'))
      .toBeHidden();

    await generateReport(page);

    await expect(page.locator('#capstoneReportStatus'))
      .toContainText('calculate your combined Capstone score');

    // Review the changed mission again.
    await page.locator('#capstoneM3Review').click();

    await expect(page.locator('#capstoneM3Score'))
      .toHaveText('15/20');

    await calculateSummary(page);
    await generateReport(page);

    await expect(page.locator('#capstoneReportResult'))
      .toBeVisible();

    await expect(page.locator('#capstoneReportScore'))
      .toHaveText('95/100');

    await expect(
      page.locator('#capstoneReportImprovements')
    ).toContainText('Assertions & State Validation');
  });

  test('reset preserves other drafts and existing My Progress', async ({ page }) => {
    const existingProgress = JSON.stringify({
      version: 1,
      sessions: [{
        id: 'existing-learner-session',
        score: 85
      }]
    });

    await page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, {
      key: progressKey,
      value: existingProgress
    });

    await completeFullAssessment(page);

    const draftKeys = answers.map(
      (_, index) =>
        `practical-qa-capstone-m${index + 1}-draft-v1`
    );

    const before = await page.evaluate(keys =>
      keys.map(key => localStorage.getItem(key)),
      draftKeys
    );

    await page.locator('#capstoneM4Reset').click();

    await expect(page.locator('#capstoneReportResult'))
      .toBeHidden();

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();

    await calculateSummary(page);

    await expect(page.locator('#capstoneSummaryStatus'))
      .toContainText('Mission 4');

    const after = await page.evaluate(
      ({ keys, progress }) => ({
        drafts: keys.map(key => localStorage.getItem(key)),
        progress: localStorage.getItem(progress)
      }),
      { keys: draftKeys, progress: progressKey }
    );

    for (let index = 0; index < 6; index++) {
      if (index === 3) {
        expect(after.drafts[index]).toBeNull();
      } else {
        expect(after.drafts[index]).toBe(before[index]);
      }
    }

    expect(after.progress).toBe(existingProgress);
  });

  test('refresh retains drafts but not completed report state', async ({ page }) => {
    await completeFullAssessment(page);

    await page.reload();

    await expect(page.locator('#capstoneM1Smoke'))
      .toHaveValue('journey');

    await expect(page.locator('#capstoneM6Request'))
      .toHaveValue('get');

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();

    await expect(page.locator('#capstoneReportResult'))
      .toBeHidden();

    await generateReport(page);

    await expect(page.locator('#capstoneReportResult'))
      .toBeHidden();

    // Existing drafts can be reviewed again.
    for (let number = 1; number <= 6; number++) {
      await page.locator(
        `#capstoneM${number}Review`
      ).click();
    }

    await calculateSummary(page);
    await generateReport(page);

    await expect(page.locator('#capstoneReportScore'))
      .toHaveText('100/100');
  });

  test('downloads a readable text report', async ({ page }) => {
    await completeFullAssessment(page);

    const downloadPromise = page.waitForEvent('download');

    await page.locator('#capstoneReportDownload').click();

    const download = await downloadPromise;

    expect(download.suggestedFilename())
      .toBe('shopflow-guided-qa-assessment.txt');

    const path = await download.path();
    const content = await readFile(path, 'utf8');

    expect(content).toContain(
      'SHOPFLOW — GUIDED QA ASSESSMENT REPORT'
    );

    expect(content).toContain('100/100');
    expect(content).toContain('MISSION PERFORMANCE');
    expect(content).toContain('ASSESSMENT STRENGTHS');
    expect(content).toContain('DEVELOPMENT PRIORITIES');

    expect(content).toContain(
      'ACCEPTANCE CRITERIA — NOT EXECUTED'
    );

    expect(content).toContain('AC-07');
    expect(content).toContain('UNDETERMINED');

    expect(content).toContain(
      'not verified software quality'
    );
  });

});
