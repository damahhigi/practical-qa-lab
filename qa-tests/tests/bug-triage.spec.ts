import { test, expect } from '@playwright/test';

test.describe('Bug Triage & Defect Management Lab', () => {

  test('loads the Bug Triage Lab correctly', async ({ page }) => {
    await page.goto('/bug-triage/');

    await expect(page).toHaveTitle(
      /Bug Triage & Defect Management/
    );

    await expect(page.locator('#completedCount')).toHaveText('0/5');

    await expect(page.getByText('PAY-381').first()).toBeVisible();

    await expect(page.locator('#finishReview')).toBeVisible();
  });

  test('does not submit incomplete defect assessments', async ({ page }) => {
    await page.goto('/bug-triage/');

    await page.locator('#finishReview').click();

    await expect(page.locator('#missingSummary')).toContainText(
      'Finish PAY-381'
    );

    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('preserves a written rationale after refresh', async ({ page }) => {
    await page.goto('/bug-triage/');

    const rationale =
      'Duplicate card capture creates financial risk for customers. ' +
      'The payment retry must be investigated before rollout.';

    await page.locator('#caseRationale').fill(rationale);

    await page.reload();

    await expect(page.locator('#caseRationale')).toHaveValue(rationale);

    await expect(page.locator('#completedCount')).toHaveText('0/5');

    const progress = await page.evaluate(() =>
      localStorage.getItem('practicalQaLab.progress.v1')
    );

    expect(progress).toBeNull();
  });


  test('scores five correctly triaged defects at 100/100', async ({ page }) => {
    await page.goto('/bug-triage/');

    const cases = [
      {
        id: 'PAY-381',
        severity: 'Critical',
        priority: 'P0 · Immediate',
        action: 'Escalate now / stop rollout',
        rationale: 'Production payment retries captured the card twice in 4 of 10 attempts. Customers requested refunds and no workaround exists.'
      },
      {
        id: 'AUTH-204',
        severity: 'High',
        priority: 'P1 · Before release',
        action: 'Fix and retest before release',
        rationale: 'Android 14 password reset email fails 6 of 10 times. Users cannot recover account access, so a fix is needed before release.'
      },
      {
        id: 'FIN-118',
        severity: 'Medium',
        priority: 'P1 · Before release',
        action: 'Fix and retest before release',
        rationale: 'The CSV export omits currency for an enterprise audit due tomorrow. A manual workaround exists, but the deadline makes this urgent.'
      },
      {
        id: 'CAT-052',
        severity: 'Medium',
        priority: 'P2 · Next cycle',
        action: 'Schedule a prioritized fix',
        rationale: 'On slow 3G networks, catalogue filters take 8 to 10 seconds. Checkout still works, and performance improvements can be planned for the next sprint.'
      },
      {
        id: 'UI-019',
        severity: 'Low',
        priority: 'P3 · Backlog',
        action: 'Document and defer with approval',
        rationale: 'At 320px the tooltip has a cosmetic 2px alignment issue. It remains usable, and the product owner approved deferral.'
      }
    ];

    for (let i = 0; i < cases.length; i++) {
      const item = cases[i];

      await expect(page.locator('#caseCode')).toHaveText(item.id);

      await page.locator('#severityOptions')
        .getByText(item.severity, { exact: true }).click();

      await page.locator('#priorityOptions')
        .getByText(item.priority, { exact: true }).click();

      await page.locator('#actionOptions')
        .getByText(item.action, { exact: true }).click();

      await page.locator('#caseRationale').fill(item.rationale);

      if (i < cases.length - 1) {
        await page.locator('#nextCase').click();
      }
    }

    await expect(page.locator('#completedCount')).toHaveText('5/5');

    await page.locator('#finishReview').click();

    await expect(page.locator('#totalScore')).toHaveText('100/100');

    await expect(page.locator('#progressSaveStatus'))
      .toContainText('score saved to My Progress');

    const history = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('practicalQaLab.progress.v1') ?? '[]')
    );

    expect(history).toHaveLength(1);
    expect(history[0].type).toBe('challenge');
    expect(history[0].area).toBe('bugtriage');
    expect(history[0].score).toBe(100);
    expect(history[0].maxScore).toBe(100);
    expect(history[0].questionScores).toEqual([20, 20, 20, 20, 20]);
  });


  test('does not duplicate an unchanged review after reload', async ({ page }) => {
    await page.goto('/bug-triage/');

    const answers = {
      'PAY-381': {
        severity: 'critical',
        priority: 'p0',
        action: 'stop',
        rationale: 'Production payment retries charged customers twice. Four of ten attempts caused duplicate captures, requiring refunds.'
      },
      'AUTH-204': {
        severity: 'high',
        priority: 'p1',
        action: 'fix',
        rationale: 'Android 14 password reset fails in 6 of 10 attempts. Users cannot recover account access before release.'
      },
      'FIN-118': {
        severity: 'medium',
        priority: 'p1',
        action: 'fix',
        rationale: 'The CSV export omits currency information. The enterprise audit is tomorrow, despite an available manual workaround.'
      },
      'CAT-052': {
        severity: 'medium',
        priority: 'p2',
        action: 'plan',
        rationale: 'Catalogue filters take 8 to 10 seconds on slow 3G networks. Checkout works and improvements can wait for the next sprint.'
      },
      'UI-019': {
        severity: 'low',
        priority: 'p3',
        action: 'defer',
        rationale: 'The tooltip alignment is off by 2px at 320px. This cosmetic issue has an approved deferral from the product owner.'
      }
    };

    // Seed a valid draft in Playwright's isolated browser storage.
    await page.evaluate((savedAnswers) => {
      localStorage.setItem(
        'practical-qa-bug-triage-stage1-v1',
        JSON.stringify({
          version: 1,
          active: 0,
          answers: savedAnswers
        })
      );
    }, answers);

    await page.reload();

    await expect(page.locator('#completedCount')).toHaveText('5/5');

    // First submission
    await page.locator('#finishReview').click();

    await expect(page.locator('#totalScore')).toHaveText('100/100');

    const firstHistory = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('practicalQaLab.progress.v1') ?? '[]')
    );

    expect(firstHistory).toHaveLength(1);
    expect(firstHistory[0].area).toBe('bugtriage');

    const firstId = firstHistory[0].id;

    // Refresh and submit identical answers again.
    await page.reload();

    await expect(page.locator('#completedCount')).toHaveText('5/5');

    await page.locator('#finishReview').click();

    await expect(page.locator('#progressSaveStatus'))
      .toContainText('already saved');

    const secondHistory = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('practicalQaLab.progress.v1') ?? '[]')
    );

    expect(secondHistory).toHaveLength(1);
    expect(secondHistory[0].id).toBe(firstId);

    // Verify the homepage dashboard also shows one attempt.
    await page.goto('/');

    await page.getByRole('button', {
      name: /View my progress/
    }).first().click();

    await expect(page.locator('#progressSessions')).toHaveText('1');
    await expect(page.locator('#progressAreas')).toHaveText('1/13');
  });

});
