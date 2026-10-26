import { test, expect } from '@playwright/test';

const learningPath = '/automation-lab/learning-path/';
const capstonePath = '/automation-lab/capstone/';

const capstoneLinkName =
  'Open ShopFlow Automation Capstone: final challenge';

test.describe('v1.5 ShopFlow - Learning Path Navigation', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(learningPath);
  });

  test('shows the available ShopFlow Capstone', async ({ page }) => {
    const section = page.locator('.capstone-preview');

    await expect(
      section.getByRole('heading', {
        name: 'Automation Capstone: ShopFlow Release Check'
      })
    ).toBeVisible();

    await expect(section).toContainText('Available now');
    await expect(section).toContainText('100 points');

    await expect(section)
      .not.toContainText('Under development');

    const link = page.getByRole('link', {
      name: capstoneLinkName
    });

    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute(
      'href', '../capstone/'
    );

    await expect(link).toContainText('Start Capstone');
  });

  test('opens the ShopFlow assessment', async ({ page }) => {
    await page.getByRole('link', {
      name: capstoneLinkName
    }).click();

    await expect(page).toHaveURL(
      /\/automation-lab\/capstone\/?$/
    );

    await expect(
      page.getByRole('heading', {
        name: 'ShopFlow Release Check'
      })
    ).toBeVisible();

    await expect(
      page.locator('.hero .brief-status')
    ).toHaveText('Guided simulation');

    await expect(
      page.getByRole('heading', {
        name: 'Final Assessment Summary'
      })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', {
        name: 'ShopFlow QA Assessment Report'
      })
    ).toBeVisible();
  });

  test('returns from ShopFlow to the Learning Path', async ({ page }) => {
    await page.goto(capstonePath);

    const backLink = page.locator(
      'header a.back-link'
    );

    await expect(backLink).toHaveAttribute(
      'href', '../learning-path/'
    );

    await backLink.click();

    await expect(page).toHaveURL(
      /\/automation-lab\/learning-path\/?$/
    );

    await expect(
      page.getByRole('heading', {
        name: 'Build reliable tests, one skill at a time.'
      })
    ).toBeVisible();
  });

  test('preserves all six original module links', async ({ page }) => {
    const paths: Record<number, string> = {
      1: '../',
      2: '../module-2/',
      3: '../module-3/',
      4: '../module-4/',
      5: '../module-5/',
      6: '../module-6/'
    };

    for (let number = 1; number <= 6; number++) {
      const link = page.locator(
        `a[aria-label^="Open Module ${number}:"]`
      );

      await expect(link).toHaveCount(1);
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute(
        'href', paths[number]
      );
    }

    // Module 1 lives at the Automation Lab root.
    await page.locator(
      'a[aria-label^="Open Module 1:"]'
    ).click();

    await expect(page).toHaveURL(
      /\/automation-lab\/?$/
    );

    // Verify a later module also remains accessible.
    await page.goto(learningPath);

    await page.locator(
      'a[aria-label^="Open Module 6:"]'
    ).click();

    await expect(page).toHaveURL(
      /\/automation-lab\/module-6\/?$/
    );
  });

  test('supports keyboard navigation', async ({ page }) => {
    const link = page.getByRole('link', {
      name: capstoneLinkName
    });

    await link.focus();
    await expect(link).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(
      /\/automation-lab\/capstone\/?$/
    );

    await expect(
      page.getByRole('heading', {
        name: 'ShopFlow Release Check'
      })
    ).toBeVisible();
  });

  test('provides a usable mobile Capstone link', async ({ page }) => {
    await page.setViewportSize({
      width: 390,
      height: 844
    });

    const link = page.getByRole('link', {
      name: capstoneLinkName
    });

    await expect(link).toBeVisible();

    const box = await link.boundingBox();

    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    await link.click();

    await expect(page).toHaveURL(
      /\/automation-lab\/capstone\/?$/
    );

    await expect(
      page.getByRole('heading', {
        name: 'ShopFlow Release Check'
      })
    ).toBeVisible();
  });

  test('preserves progress during navigation', async ({ page }) => {
    const key = 'practicalQaLab.progress.v1';

    const existing = JSON.stringify([
      {
        id: 'automation-capstone-v1-' + '1'.repeat(20),
        type: 'practice',
        area: 'automation',
        score: 100,
        maxScore: 100,
        completedAt: '2026-10-26T08:00:00.000Z',
        questionScores: [15, 20, 20, 15, 15, 15]
      }
    ]);

    await page.evaluate(({ key, value }) => {
      localStorage.setItem(key, value);
    }, {
      key,
      value: existing
    });

    await page.getByRole('link', {
      name: capstoneLinkName
    }).click();

    await expect(page).toHaveURL(
      /\/automation-lab\/capstone\/?$/
    );

    await page.locator(
      'header a.back-link'
    ).click();

    const after = await page.evaluate(
      key => localStorage.getItem(key),
      key
    );

    expect(after).toBe(existing);
  });

});
