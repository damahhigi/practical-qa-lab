import { test, expect } from '@playwright/test';

const capstoneUrl = '/automation-lab/capstone/';
const learningPathUrl = '/automation-lab/learning-path/';

test.describe('v1.5 ShopFlow - Release Quality', () => {

  test('loads without uncaught JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto(capstoneUrl);

    await expect(
      page.getByRole('heading', {
        name: 'ShopFlow Release Check'
      })
    ).toBeVisible();

    // Exercise the initial incomplete-assessment state.
    await page.locator('#capstoneSummaryReview').click();
    await page.locator('#capstoneReportGenerate').click();

    await expect(page.locator('#capstoneSummaryResult'))
      .toBeHidden();

    await expect(page.locator('#capstoneReportResult'))
      .toBeHidden();

    expect(errors).toEqual([]);
  });

  test('has a main landmark and usable skip link', async ({ page }) => {
    await page.goto(capstoneUrl);

    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);

    const skip = page.locator('a.skip-link');

    await expect(skip).toHaveAttribute('href', '#main');

    // The skip link should be the first keyboard target.
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();

    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/#main$/);
  });

  test('provides accessible names for all 20 decisions', async ({ page }) => {
    await page.goto(capstoneUrl);

    const controls = page.locator(
      'form[id^="capstoneM"] select'
    );

    await expect(controls).toHaveCount(20);

    const missingLabels = await controls.evaluateAll(nodes =>
      nodes
        .filter(node => {
          const select = node as HTMLSelectElement;

          const hasLabel = Array.from(
            select.labels ?? []
          ).some(label =>
            Boolean(label.textContent?.trim())
          );

          const ariaLabel = Boolean(
            select.getAttribute('aria-label')?.trim()
          );

          const referencedIds = (
            select.getAttribute('aria-labelledby') || ''
          )
            .trim()
            .split(/\s+/)
            .filter(Boolean);

          const ariaLabelledBy =
            referencedIds.length > 0 &&
            referencedIds.every(id => {
              const source = document.getElementById(id);
              return Boolean(source?.textContent?.trim());
            });

          return !(
            hasLabel ||
            ariaLabel ||
            ariaLabelledBy
          );
        })
        .map(node =>
          (node as HTMLSelectElement).id || 'unnamed-select'
        )
    );

    expect(
      missingLabels,
      `Unlabelled select controls: ${missingLabels.join(', ')}`
    ).toEqual([]);
  });

  test('announces scoring and report status updates', async ({ page }) => {
    await page.goto(capstoneUrl);

    const regions = [
      '#capstoneSummaryStatus',
      '#capstoneReportStatus'
    ];

    for (const selector of regions) {
      const region = page.locator(selector);

      await expect(region).toHaveAttribute(
        'role', 'status'
      );

      await expect(region).toHaveAttribute(
        'aria-live', 'polite'
      );
    }

    await page.locator('#capstoneSummaryReview').click();

    await expect(page.locator('#capstoneSummaryStatus'))
      .toContainText('Mission 1');

    await page.locator('#capstoneReportGenerate').click();

    await expect(page.locator('#capstoneReportStatus'))
      .toContainText('calculate');
  });

  test('prevents horizontal page overflow on narrow screens', async ({ page }) => {
    for (const width of [320, 390]) {
      await page.setViewportSize({
        width,
        height: 844
      });

      for (const url of [learningPathUrl, capstoneUrl]) {
        await page.goto(url);

        const dimensions = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          documentWidth: document.documentElement.scrollWidth
        }));

        expect(
          dimensions.documentWidth,
          `${url} at ${width}px: ` +
          JSON.stringify(dimensions)
        ).toBeLessThanOrEqual(dimensions.viewport + 2);
      }
    }
  });

  test('shows a visible keyboard focus outline on Start Capstone', async ({ page }) => {
    await page.goto(learningPathUrl);

    const link = page.getByRole('link', {
      name: 'Open ShopFlow Automation Capstone: final challenge'
    });

    // Establish keyboard modality before focusing the link.
    await page.keyboard.press('Tab');
    await link.focus();

    await expect(link).toBeFocused();

    const outline = await link.evaluate(element => {
      const style = getComputedStyle(element);

      return {
        type: style.outlineStyle,
        width: parseFloat(style.outlineWidth)
      };
    });

    expect(outline.type).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });

  test('keeps primary assessment controls usable on mobile', async ({ page }) => {
    const width = 390;

    await page.setViewportSize({
      width,
      height: 844
    });

    await page.goto(capstoneUrl);

    for (const selector of [
      '#capstoneSummaryReview',
      '#capstoneReportGenerate'
    ]) {
      const button = page.locator(selector);

      await expect(button).toBeVisible();
      await expect(button).toBeEnabled();

      const bounds = await button.boundingBox();

      expect(bounds, selector).not.toBeNull();

      expect(
        bounds!.height,
        `${selector} touch target height`
      ).toBeGreaterThanOrEqual(44);

      expect(bounds!.x).toBeGreaterThanOrEqual(-2);

      expect(
        bounds!.x + bounds!.width,
        `${selector} extends beyond the viewport`
      ).toBeLessThanOrEqual(width + 2);
    }
  });

});
