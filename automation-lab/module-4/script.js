(() => {
  'use strict';

  // Isolated module draft; never touches earlier modules or My Progress.
  const STORAGE_KEY = 'practical-qa-automation-m4-draft-v1';
  const stages = [
    {
      id: 'name', title: 'Missing required name', points: 20,
      options: {
        wrong1: "await expect(page.getByRole('alert')).toBeVisible();",
        correct: "await expect(page.getByRole('alert')).toHaveText('Full name is required');",
        wrong2: "await expect(page.getByRole('alert')).toHaveText('Email address is required');"
      },
      guidance: 'Check the specific required-name message with toHaveText(). Alert visibility alone cannot prove that the correct validation was triggered; the email message checks the wrong field.'
    },
    {
      id: 'email', title: 'Invalid email format', points: 25,
      options: {
        wrong1: "await page.getByLabel('Email address').fill('qa@example.com');",
        correct: "await page.getByLabel('Email address').fill('not-an-email');",
        wrong2: "await page.getByLabel('Email address').fill('');"
      },
      guidance: 'Use a nonempty malformed value such as not-an-email to isolate the invalid-format rule. A valid email tests acceptance; an empty email tests required-field validation.'
    },
    {
      id: 'min', title: 'Minimum password boundary', points: 25,
      options: {
        wrong1: "await page.getByLabel('Password').fill('Abc12345');",
        correct: "await page.getByLabel('Password').fill('Abc1234');",
        wrong2: "await page.getByLabel('Password').fill('Abc123');"
      },
      guidance: 'For an 8-character minimum, the nearest invalid boundary is 7 characters. The 8-character input should be valid; 6 characters is negative but does not specifically test minimum minus one.'
    },
    {
      id: 'max', title: 'Maximum password boundary', points: 30,
      options: {
        wrong1: "await page.getByLabel('Password').fill('Abc12345678901234567');",
        correct: "await page.getByLabel('Password').fill('Abc123456789012345678');",
        wrong2: "await page.getByLabel('Password').fill('Abc1234567890123456789');"
      },
      guidance: 'For a 20-character maximum, test 21 characters to verify the first rejected value. 20 characters is valid; 22 characters is invalid but is not the immediate boundary.'
    }
  ];

  const $ = id => document.getElementById(id);
  const choices = Object.fromEntries(stages.map(stage => [stage.id, '']));
  let reviewed = false;

  function selectedStatement(stage) {
    return stage.options[choices[stage.id]] || '';
  }

  function placeholder(stage) {
    return selectedStatement(stage) || `// Choose your ${stage.title.toLowerCase()} statement`;
  }

  function preview() {
    for (const stage of stages) {
      $(`${stage.id}Selected`).textContent = selectedStatement(stage) || 'None yet';
    }
    const line = id => placeholder(stages.find(stage => stage.id === id));
    const code = [
      "import { test, expect } from '@playwright/test';",
      '',
      "test('requires a full name', async ({ page }) => {",
      "  await page.goto('/register');",
      "  await page.getByLabel('Email address').fill('taylor@example.com');",
      "  await page.getByLabel('Password').fill('Abc1234567');",
      "  await page.getByRole('button', { name: 'Create account' }).click();",
      `  ${line('name')}`,
      '});',
      '',
      "test('rejects a malformed email', async ({ page }) => {",
      "  await page.goto('/register');",
      "  await page.getByLabel('Full name').fill('Taylor QA');",
      `  ${line('email')}`,
      "  await page.getByLabel('Password').fill('Abc1234567');",
      "  await page.getByRole('button', { name: 'Create account' }).click();",
      "  await expect(page.getByRole('alert')).toHaveText('Enter a valid email address');",
      '});',
      '',
      "test('rejects 7-character passwords', async ({ page }) => {",
      "  await page.goto('/register');",
      "  await page.getByLabel('Full name').fill('Taylor QA');",
      "  await page.getByLabel('Email address').fill('taylor@example.com');",
      `  ${line('min')}`,
      "  await page.getByRole('button', { name: 'Create account' }).click();",
      "  await expect(page.getByRole('alert')).toHaveText('Password must be 8–20 characters');",
      '});',
      '',
      "test('rejects 21-character passwords', async ({ page }) => {",
      "  await page.goto('/register');",
      "  await page.getByLabel('Full name').fill('Taylor QA');",
      "  await page.getByLabel('Email address').fill('taylor@example.com');",
      `  ${line('max')}`,
      "  await page.getByRole('button', { name: 'Create account' }).click();",
      "  await expect(page.getByRole('alert')).toHaveText('Password must be 8–20 characters');",
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
      ? 'You chose the preferred negative-testing statements. This rubric review did not execute Playwright.'
      : 'Review the explanations, revise your choices, and submit again. This is a simulated assessment.';
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
      ? window.AutomationLabProgress.save(4, stages, choices)
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
    if (!window.confirm('Clear the four Module 4 choices saved in this browser?')) return;
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
