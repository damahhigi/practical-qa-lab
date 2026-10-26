import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const progressKey = 'practicalQaLab.progress.v1';

const capstone = {
  id: 'automation-capstone-v1-' + '1'.repeat(20),
  type: 'practice',
  area: 'automation',
  score: 100,
  maxScore: 100,
  completedAt: '2026-10-25T10:00:00.000Z',
  questionScores: [15, 20, 20, 15, 15, 15]
};

const moduleSix = {
  id: 'automation-m6-cccc',
  type: 'practice',
  area: 'automation',
  score: 100,
  maxScore: 100,
  completedAt: '2026-10-24T10:00:00.000Z',
  questionScores: [20, 25, 25, 30]
};

const manualSession = {
  id: 'manual-session-001',
  type: 'practice',
  area: 'manual',
  score: 80,
  maxScore: 100,
  completedAt: '2026-10-23T10:00:00.000Z',
  questionScores: [20, 20, 20, 20]
};

async function seedHistory(page: Page, sessions: unknown[]) {
  await page.evaluate(({ key, records }) => {
    localStorage.setItem(key, JSON.stringify(records));
  }, {
    key: progressKey,
    records: sessions
  });
}

async function renderDashboard(page: Page) {
  await page.evaluate(() => {
    const host = window as typeof window & {
      renderProgressDashboard?: () => void
    };

    if (typeof host.renderProgressDashboard !== 'function') {
      throw new Error('My Progress renderer is unavailable');
    }

    host.renderProgressDashboard();
  });
}

async function readHistory(page: Page) {
  return page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return raw === null ? [] : JSON.parse(raw);
  }, progressKey);
}

test.describe('v1.5 ShopFlow - Dashboard and Backups', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays Capstone and module names independently', async ({ page }) => {
    await seedHistory(page, [
      capstone,
      moduleSix,
      manualSession
    ]);

    await renderDashboard(page);

    const rows = page.locator('#progressHistory li');

    await expect(rows).toHaveCount(3);

    await expect(rows.nth(0)).toContainText(
      'ShopFlow Automation Capstone'
    );

    await expect(rows.nth(0)).toContainText(
      '100/100'
    );

    await expect(rows.nth(1)).toContainText(
      'Module 6 — API Automation'
    );

    await expect(rows.nth(2)).toContainText(
      'Manual QA'
    );

    expect(await readHistory(page)).toEqual([
      capstone,
      moduleSix,
      manualSession
    ]);
  });

  test('includes Capstone in the existing automation area', async ({ page }) => {
    const lowerScoringModule = {
      ...moduleSix,
      score: 60,
      questionScores: [20, 0, 20, 20]
    };

    await seedHistory(page, [
      capstone,
      lowerScoringModule
    ]);

    await renderDashboard(page);

    const automationRow = page.locator(
      '#progressAreasList .progress-area-row'
    ).filter({
      hasText: 'Test Automation Lab'
    });

    await expect(automationRow).toHaveCount(1);

    await expect(automationRow).toContainText(
      '80% average'
    );

    await expect(automationRow).toContainText(
      '2 attempts'
    );

    await expect(
      page.locator('#progressHistory li')
    ).toHaveCount(2);
  });

  test('exports Capstone attempts without data loss', async ({ page }) => {
    await seedHistory(page, [
      capstone,
      moduleSix,
      manualSession
    ]);

    await renderDashboard(page);

    const downloadPromise = page.waitForEvent('download');

    await page.evaluate(() => {
      const host = window as typeof window & {
        exportLearningProgress?: () => void
      };

      if (typeof host.exportLearningProgress !== 'function') {
        throw new Error('Progress export is unavailable');
      }

      host.exportLearningProgress();
    });

    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.json$/);

    const content = await readFile(
      await download.path(),
      'utf8'
    );

    const backup = JSON.parse(content);

    expect(backup.format).toBe(
      'practical-qa-lab-progress'
    );

    expect(backup.version).toBe(1);

    expect(backup.sessions).toHaveLength(3);

    const restoredCapstone = backup.sessions.find(
      (item: { id: string }) => item.id === capstone.id
    );

    expect(restoredCapstone).toEqual(capstone);

    expect(
      backup.sessions.find(
        (item: { id: string }) =>
          item.id === moduleSix.id
      )
    ).toEqual(moduleSix);

    expect(
      backup.sessions.find(
        (item: { id: string }) =>
          item.id === manualSession.id
      )
    ).toEqual(manualSession);
  });

  test('imports Capstone backup using merge without duplicates', async ({ page }) => {
    await seedHistory(page, [manualSession]);

    await renderDashboard(page);

    const backup = {
      format: 'practical-qa-lab-progress',
      version: 1,
      exportedAt: '2026-10-26T08:00:00.000Z',
      sessions: [capstone, moduleSix]
    };

    await page.locator('#progressImportFile').setInputFiles({
      name: 'shopflow-progress-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup))
    });

    await expect(
      page.locator('#progressImportPreview')
    ).toContainText('Backup verified');

    const importButton = page.locator(
      '#importProgressButton'
    );

    await expect(importButton).toBeEnabled();

    // Trigger the existing import button handler,
    // including when the progress section is collapsed.
    await importButton.evaluate(
      (button: HTMLButtonElement) => button.click()
    );

    const history = await readHistory(page);

    expect(history).toHaveLength(3);

    expect(history).toContainEqual(capstone);
    expect(history).toContainEqual(moduleSix);
    expect(history).toContainEqual(manualSession);

    await expect(
      page.locator('#progressHistory')
    ).toContainText('ShopFlow Automation Capstone');

    // Importing the same backup again must not
    // offer to create duplicate records.
    await page.locator('#progressImportFile').setInputFiles([]);

    await page.locator('#progressImportFile').setInputFiles({
      name: 'shopflow-progress-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup))
    });

    await expect(
      page.locator('#progressImportPreview')
    ).toContainText('skip 2 already saved');

    await expect(importButton).toBeDisabled();

    expect(await readHistory(page)).toEqual(history);
  });

});
