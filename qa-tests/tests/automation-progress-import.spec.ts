import { test, expect } from '@playwright/test';

test.describe('Automation Lab progress backup restoration', () => {

  test('merges a backup and preserves module IDs without duplicates', async ({ page }) => {
    const key = 'practicalQaLab.progress.v1';

    const manualSession = {
      id: 'historic-manual-123',
      type: 'practice',
      area: 'manual',
      score: 68,
      maxScore: 100,
      completedAt: '2026-10-21T10:00:00.000Z',
      questionScores: [18, 20, 30]
    };

    const automationSession = {
      id: 'automation-m1-cccc',
      type: 'practice',
      area: 'automation',
      score: 100,
      maxScore: 100,
      completedAt: '2026-10-22T08:00:00.000Z',
      questionScores: [20, 20, 25, 35]
    };

    const backup = {
      format: 'practical-qa-lab-progress',
      version: 1,
      exportedAt: '2026-10-22T09:00:00.000Z',
      sessions: [manualSession, automationSession]
    };

    await page.goto('/');

    // Seed existing progress in this isolated browser only.
    await page.evaluate(({ key, manualSession }) => {
      localStorage.setItem(key, JSON.stringify([manualSession]));
    }, { key, manualSession });

    await page.reload();

    // Open My Progress.
    await page.getByRole('button', {
      name: 'My Progress',
      exact: true
    }).click();

    // Upload a version-1 backup using the real import control.
    const fileInput = page.locator('#progressImportFile');

    const backupFile = {
      name: 'qa-progress-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup))
    };

    await fileInput.setInputFiles(backupFile);

    // Merge should add Module 1 but skip existing Manual QA.
    await expect(page.locator('#progressImportPreview'))
      .toContainText('Merge would add 1 new, skip 1 already saved');

    await expect(page.locator('#importProgressButton'))
      .toBeEnabled();

    await page.locator('#importProgressButton').click();

    await expect(page.locator('#progressImportStatus'))
      .toContainText('Progress merged: 1 new sessions added');

    const saved = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      key
    );

    expect(saved).toHaveLength(2);
    expect(saved).toContainEqual(manualSession);
    expect(saved).toContainEqual(automationSession);

    // Re-importing the same backup must not add duplicates.
    await fileInput.setInputFiles(backupFile);

    await expect(page.locator('#progressImportPreview'))
      .toContainText('Merge would add 0 new, skip 2 already saved');

    await expect(page.locator('#importProgressButton'))
      .toBeDisabled();

    await page.reload();

    const restored = await page.evaluate(key =>
      JSON.parse(localStorage.getItem(key) || '[]'),
      key
    );

    expect(restored).toHaveLength(2);
    expect(restored).toContainEqual(manualSession);
    expect(restored).toContainEqual(automationSession);
  });

});
