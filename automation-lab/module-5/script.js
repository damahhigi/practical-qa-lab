(() => {
  'use strict';

  // Isolated Module 5 draft. Never modifies other drafts or My Progress.
  const STORAGE_KEY = 'practical-qa-automation-m5-draft-v1';
  const stages = [
    {
      id: 'timing', title: 'Fixed-wait timing issue', points: 20,
      options: {
        wrong1: 'await page.waitForTimeout(3000);',
        correct: "await expect(page.getByRole('button', { name: 'Pay now' })).toBeEnabled();",
        wrong2: "await expect(page.getByRole('button', { name: 'Pay now' })).toBeVisible();"
      },
      guidance: 'Wait for the actual condition: the button becoming enabled. waitForTimeout() is a fixed guess. toBeVisible() checks presence, not whether the button can be clicked.'
    },
    {
      id: 'locator', title: 'Unstable product locator', points: 25,
      options: {
        wrong1: "await page.locator('.product-card').nth(0).locator('button').click();",
        correct: "await page.getByRole('article', { name: 'Canvas Backpack' }).getByRole('button', { name: 'Add to cart' }).click();",
        wrong2: "await page.getByRole('button', { name: 'Add to cart' }).click();"
      },
      guidance: 'Scope the Add to cart button to the named Canvas Backpack article. nth(0) depends on ordering. An unscoped button locator matches both products and can trigger a strict-mode error.'
    },
    {
      id: 'async', title: 'Asynchronous orders result', points: 25,
      options: {
        wrong1: "await expect(page.getByRole('status')).toBeVisible();",
        correct: "await expect(page.getByRole('status')).toHaveText('3 orders loaded');",
        wrong2: "expect(await page.getByRole('status').textContent()).toBe('3 orders loaded');"
      },
      guidance: 'An awaited toHaveText() assertion retries until the expected final status appears or times out. Visibility also passes for Loading orders; a one-time textContent() snapshot does not auto-retry.'
    },
    {
      id: 'isolation', title: 'Shared signup test data', points: 30,
      options: {
        wrong1: "const email = 'qa@example.com';",
        correct: 'const email = `qa+${randomUUID()}@example.com`;',
        wrong2: 'const email = `qa+${test.info().parallelIndex}@example.com`;'
      },
      guidance: 'A fresh randomUUID() value creates a distinct test email for each attempt. A hard-coded email collides across runs, and parallelIndex identifies a worker slot, not a unique run. Unique data reduces collisions; cleanup and backend isolation can still be needed.'
    }
  ];

  const $ = id => document.getElementById(id);
  const choices = Object.fromEntries(stages.map(stage => [stage.id, '']));
  let reviewed = false;

  function selectedStatement(stage) {
    return stage.options[choices[stage.id]] || '';
  }

  function placeholder(id) {
    const stage = stages.find(item => item.id === id);
    return selectedStatement(stage) || `// Choose a fix for ${stage.title.toLowerCase()}`;
  }

  function preview() {
    for (const stage of stages) {
      $(`${stage.id}Selected`).textContent = selectedStatement(stage) || 'None yet';
    }
    const code = [
      "import { test, expect } from '@playwright/test';",
      "import { randomUUID } from 'node:crypto';",
      '',
      "test('waits until payment can start', async ({ page }) => {",
      "  await page.goto('/checkout');",
      `  ${placeholder('timing')}`,
      "  await page.getByRole('button', { name: 'Pay now' }).click();",
      '});',
      '',
      "test('adds the intended product', async ({ page }) => {",
      "  await page.goto('/products');",
      `  ${placeholder('locator')}`,
      '});',
      '',
      "test('waits for refreshed orders', async ({ page }) => {",
      "  await page.goto('/orders');",
      "  await page.getByRole('button', { name: 'Refresh orders' }).click();",
      `  ${placeholder('async')}`,
      '});',
      '',
      "test('signs up with a fresh email', async ({ page }) => {",
      "  await page.goto('/signup');",
      `  ${placeholder('isolation')}`,
      "  await page.getByLabel('Email address').fill(email);",
      "  await page.getByRole('button', { name: 'Create account' }).click();",
      "  await expect(page.getByRole('status')).toHaveText('Account created');",
      '});'
    ].join('\n');
    $('codePreview').textContent = code;
    $('completedCount').textContent = `${stages.filter(stage => choices[stage.id]).length}/4`;
  }

  function saveDraft() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, choices }));
      $('draftStatus').textContent = 'Draft saved in this browser';
    } catch (_) {
      $('draftStatus').textContent = 'Browser storage unavailable · choices remain on this page';
    }
  }

  function restoreDraft() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (!value) return;
      const saved = JSON.parse(value);
      if (!saved || saved.version !== 1 || !saved.choices || typeof saved.choices !== 'object') return;
      for (const stage of stages) {
        const value = saved.choices[stage.id];
        if (typeof value !== 'string' || !Object.prototype.hasOwnProperty.call(stage.options, value)) continue;
        choices[stage.id] = value;
        $(`${stage.id}Choice`).value = value;
      }
      $('draftStatus').textContent = 'Draft restored from this browser';
    } catch (_) {
      $('draftStatus').textContent = 'Draft unavailable · you can continue';
    }
  }

  function invalidateReview() {
    if (!reviewed) return;
    reviewed = false;
    $('reviewResult').hidden = true;
    $('formStatus').textContent = 'Choices updated · review again to refresh feedback.';
  }

  function review() {
    const missing = stages.find(stage => !choices[stage.id]);
    if (missing) {
      $('formStatus').textContent = `Complete stage ${stages.indexOf(missing) + 1}: ${missing.title}.`;
      $(`${missing.id}Choice`).focus();
      return;
    }
    const score = stages.reduce((sum, stage) => sum + (choices[stage.id] === 'correct' ? stage.points : 0), 0);
    reviewed = true;
    $('totalScore').textContent = `${score}/100`;
    $('scoreFill').style.width = `${score}%`;
    $('reviewMessage').textContent = score === 100
      ? 'You selected the preferred repairs. This rubric review did not execute Playwright.'
      : 'Review the explanations and try again. This is a simulated assessment.';
    const feedback = $('feedbackList');
    feedback.replaceChildren();
    for (const stage of stages) {
      const correct = choices[stage.id] === 'correct';
      const card = document.createElement('article');
      card.className = `feedback-item${correct ? '' : ' needs-work'}`;
      const heading = document.createElement('h4');
      heading.textContent = stage.title;
      const points = document.createElement('strong');
      points.textContent = `${correct ? stage.points : 0}/${stage.points} points`;
      const explanation = document.createElement('p');
      explanation.textContent = `${correct ? 'Preferred answer.' : 'Needs revision.'} ${stage.guidance}`;
      card.append(heading, points, explanation);
      feedback.appendChild(card);
    }
    const progressResult = (
      window.AutomationLabProgress &&
      typeof window.AutomationLabProgress.save === 'function'
    )
      ? window.AutomationLabProgress.save(5, stages, choices)
      : { status: 'unavailable' };

    const progressMessages = {
      saved: 'Review complete · score saved in My Progress.',
      duplicate: 'Review complete · this assessment is already saved in My Progress.',
      invalid: 'Review complete · assessment data could not be saved.',
      unavailable: 'Review complete · progress storage unavailable.'
    };

    $('formStatus').textContent =
      progressMessages[progressResult.status] ||
      'Review complete · progress saving unavailable.';
    $('reviewResult').hidden = false;
    $('reviewResult').focus({ preventScroll: true });
    $('reviewResult').scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  }

  for (const stage of stages) {
    $(`${stage.id}Choice`).addEventListener('change', event => {
      choices[stage.id] = event.target.value;
      invalidateReview();
      preview();
      saveDraft();
    });
  }

  $('reviewButton').addEventListener('click', review);
  $('resetButton').addEventListener('click', () => {
    if (!window.confirm('Clear the four Module 5 choices saved in this browser?')) return;
    for (const stage of stages) {
      choices[stage.id] = '';
      $(`${stage.id}Choice`).value = '';
    }
    reviewed = false;
    $('reviewResult').hidden = true;
    $('formStatus').textContent = 'Draft cleared. Previously saved My Progress sessions are preserved.';
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* Storage may be blocked. */ }
    $('draftStatus').textContent = 'Draft cleared';
    preview();
  });
  $('copyCode').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('codePreview').textContent);
      $('copyStatus').textContent = 'Code copied. This fictional example needs a matching application to run.';
    } catch (_) {
      $('copyStatus').textContent = 'Copy unavailable. Select the preview text to copy manually.';
    }
  });

  restoreDraft();
  preview();
})();
