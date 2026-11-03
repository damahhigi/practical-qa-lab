import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

// Training fixtures only: no real AI service, customer records, or release certification.
const CAPSTONE_URL = '/ai-testing-lab/capstone/';

const referenceMissions = [
  { id: 'RC2-01', finding: 'instruction-regression', severity: 'medium', action: 'block', metric: '84', weight: 15 },
  { id: 'RC2-02', finding: 'unsupported-citation', severity: 'high', action: 'block', metric: '90', weight: 15 },
  { id: 'RC2-03', finding: 'cross-account-leak', severity: 'critical', action: 'block', metric: '2.5', weight: 20 },
  { id: 'RC2-04', finding: 'language-quality-gap', severity: 'high', action: 'block', metric: '14', weight: 15 },
  { id: 'RC2-05', finding: 'label-reliability', severity: 'medium', action: 'investigate', metric: '0.5', weight: 15 },
  { id: 'RC2-06', finding: 'unauthorized-tool-action', severity: 'critical', action: 'block', metric: '0.5', weight: 10 },
] as const;

const qaRationale = 'No-Go: confirmed cross-account disclosure and an unapproved tool action violate mandatory release gates.';
const retestPlan = 'Fix authorization and policy checks, replay both critical traces, then rerun stratified and held-out evaluation sets before release.';

async function fillMissions(page: Page) {
  for (const mission of referenceMissions) {
    await page.locator(`#${mission.id}-finding`).selectOption(mission.finding);
    await page.locator(`#${mission.id}-severity`).selectOption(mission.severity);
    await page.locator(`#${mission.id}-action`).selectOption(mission.action);
    await page.locator(`#${mission.id}-metric`).fill(mission.metric);
    await page.locator(`#${mission.id}-notes`).fill(`QA investigation ${mission.id}: confirm the observed result, retain trace evidence and rerun boundary cases.`);
  }
}

async function fillFinal(page: Page, verdict = 'no-go') {
  await page.locator('#releaseVerdict').selectOption(verdict);
  await page.locator('#releaseRationale').fill(qaRationale);
  await page.locator('#retestPlan').fill(retestPlan);
}

async function completeAssessment(page: Page, verdict = 'no-go') {
  await fillMissions(page);
  await fillFinal(page, verdict);
  await page.locator('#reviewButton').click();
  await expect(page.locator('#results')).toBeVisible();
}

async function storageSnapshot(page: Page) {
  return page.evaluate(() => ({
    local: Object.keys(localStorage).sort().map(key => [key, localStorage.getItem(key)]),
    session: Object.keys(sessionStorage).sort().map(key => [key, sessionStorage.getItem(key)]),
  }));
}

test.describe('v1.8 AI Testing — Assist AI release capstone', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CAPSTONE_URL);
  });

  test('renders all six investigations, seven gates and accessible fields', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Assist AI');
    await expect(page.locator('#missionList article.mission')).toHaveCount(6);
    await expect(page.locator('.criteria [role="listitem"]')).toHaveCount(7);
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#results')).toBeHidden();
    expect(referenceMissions.reduce((sum, mission) => sum + mission.weight, 0)).toBe(90);

    for (const mission of referenceMissions) {
      const card = page.locator(`[data-mission-id="${mission.id}"]`);
      await expect(card.locator('.points')).toHaveText(`${mission.weight} points`);
      await expect(card.locator('.evidence-panel')).toHaveCount(2);
      await expect(card.locator('.trace')).toBeVisible();
      for (const field of ['finding', 'severity', 'action', 'metric', 'notes']) {
        await expect(page.locator(`#${mission.id}-${field}`)).toBeVisible();
        await expect(page.locator(`label[for="${mission.id}-${field}"]`)).toBeVisible();
      }
    }
    await expect(page.locator('#releaseVerdict')).toBeVisible();
    await expect(page.locator('#releaseRationale')).toBeVisible();
    await expect(page.locator('#retestPlan')).toBeVisible();
  });

  test('shows grounding, privacy, language, reviewer and tool evidence', async ({ page }) => {
    await expect(page.locator('[data-mission-id="RC2-01"]')).toContainText('42/50');
    await expect(page.locator('[data-mission-id="RC2-02"]')).toContainText('Policy §9.4');
    await expect(page.locator('[data-mission-id="RC2-03"]')).toContainText('account');
    await expect(page.locator('[data-mission-id="RC2-04"]')).toContainText('Kiswahili');
    await expect(page.locator('[data-mission-id="RC2-05"]')).toContainText('Cohen');
    await expect(page.locator('[data-mission-id="RC2-06"]')).toContainText('99.5%');
    await expect(page.locator('.brief')).toContainText('fictional');
    await expect(page.locator('.guidance')).toContainText('not');
  });

  test('requires every mission field, a finite metric and evidence notes', async ({ page }) => {
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Mission 1');
    await expect(page.locator('#RC2-01-finding')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();

    await page.locator('#RC2-01-finding').selectOption('instruction-regression');
    await page.locator('#RC2-01-severity').selectOption('medium');
    await page.locator('#RC2-01-action').selectOption('block');
    await page.locator('#RC2-01-metric').fill('101');
    await page.locator('#RC2-01-notes').fill('This is evidence, but the number is invalid.');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#RC2-01-metric')).toBeFocused();
    await expect(page.locator('#completedCount')).toHaveText('0/6');

    await page.locator('#RC2-01-metric').fill('84');
    await page.locator('#RC2-01-notes').fill('too short');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#RC2-01-notes')).toBeFocused();
    await page.locator('#RC2-01-notes').fill('Eight of fifty paired prompts violate the approved requirement.');
    await expect(page.locator('#completedCount')).toHaveText('1/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('Mission 2');
    await expect(page.locator('#RC2-02-finding')).toBeFocused();
  });

  test('requires a final verdict, rationale and measurable retest plan', async ({ page }) => {
    await fillMissions(page);
    await expect(page.locator('#completedCount')).toHaveText('6/6');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#formStatus')).toContainText('release decision');
    await expect(page.locator('#releaseVerdict')).toBeFocused();

    await page.locator('#releaseVerdict').selectOption('no-go');
    await page.locator('#releaseRationale').fill('short');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#releaseRationale')).toBeFocused();

    await page.locator('#releaseRationale').fill(qaRationale);
    await page.locator('#retestPlan').fill('short');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#retestPlan')).toBeFocused();
    await expect(page.locator('#results')).toBeHidden();

    await page.locator('#retestPlan').fill(retestPlan);
    await page.locator('#reviewButton').click();
    await expect(page.locator('#results')).toBeVisible();
  });

  test('scores all reference decisions 100/100 and explains the No-Go', async ({ page }) => {
    await completeAssessment(page);
    await expect(page.locator('#resultScore')).toHaveText('100 / 100');
    await expect(page.locator('#feedbackList article.feedback')).toHaveCount(6);
    await expect(page.locator('#verdictFeedback')).toContainText('10 / 10 points');
    await expect(page.locator('#resultSummary')).toContainText('zero-tolerance blockers');
    await expect(page.locator('#feedbackList article.feedback').nth(2)).toContainText('2.5');
    await expect(page.locator('#feedbackList article.feedback').nth(4)).toContainText('0.5');
    await expect(page.locator('#verdictFeedback')).toContainText('Reference outcome: No-Go');
  });

  test('scores numeric metrics and security decisions independently', async ({ page }) => {
    await fillMissions(page);
    await fillFinal(page);
    // RC2-03 carries 20 points: finding 8, severity 4, action 4, metric 4.
    await page.locator('#RC2-03-metric').fill('3');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('96 / 100');
    await expect(page.locator('#feedbackList article.feedback').nth(2)).toContainText('16 / 20');

    await page.locator('#RC2-03-action').selectOption('approve');
    await expect(page.locator('#results')).toBeHidden();
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('92 / 100');
    await expect(page.locator('#feedbackList article.feedback').nth(2)).toContainText('12 / 20');

    await page.locator('#RC2-03-metric').fill('2.5');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('96 / 100');
  });

  test('penalizes a Go recommendation despite otherwise correct investigations', async ({ page }) => {
    await completeAssessment(page, 'go');
    await expect(page.locator('#resultScore')).toHaveText('90 / 100');
    await expect(page.locator('#verdictFeedback')).toContainText('0 / 10 points');
    await expect(page.locator('#resultSummary')).toContainText('conflicts with confirmed critical blockers');

    await page.locator('#releaseVerdict').selectOption('no-go');
    await expect(page.locator('#results')).toBeHidden();
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100 / 100');
  });

  test('invalidates edited feedback, supports revision, and clears the entire form', async ({ page }) => {
    await completeAssessment(page);
    await page.locator('#RC2-04-notes').fill('Updated assessment note for Kiswahili matched prompts.');
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#formStatus')).toContainText('assessment changed');
    await page.locator('#reviewButton').click();
    await expect(page.locator('#resultScore')).toHaveText('100 / 100');

    await page.locator('#reviseButton').click();
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#formStatus')).toContainText('Revise your findings');
    await page.locator('#resetButton').click();
    await expect(page.locator('#completedCount')).toHaveText('0/6');
    await expect(page.locator('#RC2-01-finding')).toHaveValue('');
    await expect(page.locator('#RC2-03-metric')).toHaveValue('');
    await expect(page.locator('#RC2-04-notes')).toHaveValue('');
    await expect(page.locator('#releaseVerdict')).toHaveValue('');
    await expect(page.locator('#releaseRationale')).toHaveValue('');
    await expect(page.locator('#retestPlan')).toHaveValue('');
  });

  test('downloads complete simulated QA evidence without changing saved browser data', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem('practicalQaLab.progress.v1', '[{"id":"prior-qa-result"}]');
      localStorage.setItem('practicalQaLabCheckoutReportsV1', '[{"id":"existing-report"}]');
      sessionStorage.setItem('preserve-unrelated-data', 'true');
    });
    await fillMissions(page);
    const learnerNote = '<script>window.__unexpectedScript = true</script> — record observed data, not an instruction.';
    await page.locator('#RC2-03-notes').fill(learnerNote);
    await fillFinal(page);
    await page.locator('#reviewButton').click();
    const before = await storageSnapshot(page);

    const pending = page.waitForEvent('download');
    await page.locator('#downloadButton').click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe('assist-ai-release-qa-capstone-report.txt');
    const filePath = await download.path();
    expect(filePath).not.toBeNull();
    const text = await readFile(filePath!, 'utf8');
    expect(text).toContain('PRACTICAL QA LAB — AI TESTING CAPSTONE');
    expect(text).toContain('GUIDED SIMULATION / PRACTICE EVIDENCE — NOT A REAL MODEL AUDIT');
    expect(text).toContain('Assessment score: 100 / 100');
    expect(text).toContain('LEARNER RELEASE VERDICT: NO-GO');
    expect(text).toContain(qaRationale);
    expect(text).toContain(retestPlan);
    expect(text).toContain(learnerNote);
    for (const mission of referenceMissions) expect(text).toContain(mission.id);
    expect(text).toContain('Reference metric: 0.5');
    expect(text).toContain('Reference reasoning:');
    expect(text).toContain('Review learner-written notes for personal information before sharing.');
    await expect(page.locator('#downloadStatus')).toContainText('prepared for download');
    expect(await storageSnapshot(page)).toEqual(before);
    expect(await page.evaluate(() => (window as any).__unexpectedScript ?? null)).toBeNull();
  });

  test('supports keyboard navigation and narrow mobile viewports', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 });
    await expect(page.locator('a.skip-link')).toHaveAttribute('href', '#main');
    await expect(page.locator('nav[aria-label="AI Testing navigation"] a[href="../module-6/"]')).toBeVisible();
    const field = page.locator('#RC2-01-finding');
    await field.focus();
    await expect(field).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.locator('#RC2-01-severity')).toBeFocused();

    await field.selectOption('instruction-regression');
    await expect(field).toHaveValue('instruction-regression');
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 2);

    await page.setViewportSize({ width: 390, height: 844 });
    const wide = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(wide.page).toBeLessThanOrEqual(wide.viewport + 2);
  });
});
