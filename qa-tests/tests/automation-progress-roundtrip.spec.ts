import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const storageKey = 'practicalQaLab.progress.v1';

test('exports and restores Automation Lab progress without data loss', async ({ page }) => {

  const sessions = [
    {
      id: 'automation-m6-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      completedAt: '2026-10-22T10:00:00.000Z',
      questionScores: [20, 25, 25, 30]
    },
    {
      id: 'automation-m1-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      completedAt: '2026-10-22T09:00:00.000Z',
      questionScores: [20, 20, 25, 35]
    },
    {
      id: 'manual-history-123',
      type: 'practice',
      area: 'manual',
      score: 68,
      maxScore: 100,
      completedAt: '2026-10-21T10:00:00.000Z',
      questionScores: [18, 20, 30]
    }
  ];

  await page.goto('/');

  // Sample data lives only in this Playwright browser.
  await page.evaluate(({ key, sessions }) => {
    localStorage.setItem(key, JSON.stringify(sessions));
  }, { key: storageKey, sessions });

  await page.reload();

  await page.getByRole('button', {
    name: 'My Progress',
    exact: true
  }).click();

  // Export using the website's actual download control.
  await expect(page.locator('#exportProgressButton'))
    .toBeEnabled();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.locator('#exportProgressButton').click()
  ]);

  expect(download.suggestedFilename()).toMatch(/\.json$/i);

  const downloadedFile = await readFile(await download.path());
  const backup = JSON.parse(downloadedFile.toString('utf8'));

  expect(backup.format).toBe('practical-qa-lab-progress');
  expect(backup.version).toBe(1);
  expect(backup.sessions).toEqual(sessions);

  // Clear only the temporary Playwright browser's progress.
  await page.evaluate(key => {
    localStorage.removeItem(key);
  }, storageKey);

  await page.reload();

  await page.getByRole('button', {
    name: 'My Progress',
    exact: true
  }).click();

  // Restore the exact file produced by the website.
  const backupFile = {
    name: 'automation-progress-roundtrip.json',
    mimeType: 'application/json',
    buffer: downloadedFile
  };

  await page.locator('#progressImportFile')
    .setInputFiles(backupFile);

  await expect(page.locator('#progressImportPreview'))
    .toContainText('Merge would add 3 new');

  await page.locator('#importProgressButton').click();

  await expect(page.locator('#progressImportStatus'))
    .toContainText('Progress merged: 3 new sessions added');

  const restored = await page.evaluate(key =>
    JSON.parse(localStorage.getItem(key) || '[]'),
    storageKey
  );

  expect(restored).toEqual(sessions);

  // Verify correct module labels after restoration.
  await expect(
    page.locator('#progressHistory .progress-history-title')
  ).toHaveText([
    'Module 6 — API Automation',
    'Module 1 — Playwright Fundamentals',
    'Manual QA'
  ]);

  // A second import must not create duplicate records.
  await page.locator('#progressImportFile')
    .setInputFiles(backupFile);

  await expect(page.locator('#progressImportPreview'))
    .toContainText('Merge would add 0 new, skip 3 already saved');

  await expect(page.locator('#importProgressButton'))
    .toBeDisabled();

  const finalSessions = await page.evaluate(key =>
    JSON.parse(localStorage.getItem(key) || '[]'),
    storageKey
  );

  expect(finalSessions).toEqual(sessions);
});
