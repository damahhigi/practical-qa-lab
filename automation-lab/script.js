(() => {
  'use strict';

  const STORAGE_KEY = 'practical-qa-automation-m1-draft-v1';
  const stages = [
    {
      id: 'imports', title: 'Playwright imports', points: 20,
      options: {
        correct: "import { test, expect } from '@playwright/test';",
        wrong1: "import { page } from '@playwright/test';",
        wrong2: "import { test, assert } from 'playwright';"
      },
      guidance: 'Import both test and expect from @playwright/test. The page fixture is provided by the test callback, not imported directly.'
    },
    {
      id: 'declaration', title: 'Test declaration', points: 20,
      options: {
        wrong1: "test('homepage loads correctly', () => {",
        wrong2: "describe('homepage loads correctly', async ({ page }) => {",
        correct: "test('homepage loads correctly', async ({ page }) => {"
      },
      guidance: 'Use test(...) with an async callback and destructure the page fixture from its argument.'
    },
    {
      id: 'navigation', title: 'Homepage navigation', points: 25,
      options: {
        wrong1: "page.goto('/');",
        correct: "await page.goto('/');",
        wrong2: "await page.click('/');"
      },
      guidance: 'Navigation is asynchronous: await page.goto(\'/\') opens the homepage when baseURL is configured.'
    },
    {
      id: 'assertion', title: 'Visible heading assertion', points: 35,
      options: {
        wrong1: "expect(page.locator('h1')).toEqual('Practical QA Lab');",
        wrong2: "await expect(page.getByText('Practical QA Lab')).toBeHidden();",
        correct: "await expect(page.getByRole('heading', { name: 'Practical QA Lab', exact: true })).toBeVisible();"
      },
      guidance: 'Locate the heading by role and accessible name, and use an awaited, auto-retrying toBeVisible assertion.'
    }
  ];

  const $ = id => document.getElementById(id);
  const choices = Object.fromEntries(stages.map(s => [s.id, '']));
  let lastReviewed = null;

  function preview() {
    const statement = id => {
      const stage = stages.find(s => s.id === id);
      return stage.options[choices[id]] || `// Choose your ${stage.title.toLowerCase()} statement`;
    };
    const code = [
      statement('imports'),
      '',
      statement('declaration'),
      `  ${statement('navigation')}`,
      '',
      `  ${statement('assertion')}`,
      '});'
    ].join('\n');
    $('codePreview').textContent = code;
    $('completedCount').textContent = `${stages.filter(s => choices[s.id]).length}/4`;
    return code;
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
        const selection = saved.choices[stage.id];
        if (typeof selection !== 'string' || !Object.prototype.hasOwnProperty.call(stage.options, selection)) continue;
        choices[stage.id] = selection;
        $(`${stage.id}Choice`).value = selection;
      }
      $('draftStatus').textContent = 'Draft restored from this browser';
    } catch (_) {
      $('draftStatus').textContent = 'Draft unavailable · you can continue';
    }
  }

  function clearReviewIfChanged() {
    if (lastReviewed !== null) {
      lastReviewed = null;
      $('reviewResult').hidden = true;
      $('formStatus').textContent = 'Choices updated · review again to refresh feedback.';
    }
  }

  function review() {
    const firstMissing = stages.find(s => !choices[s.id]);
    if (firstMissing) {
      $('formStatus').textContent = `Complete stage ${stages.indexOf(firstMissing) + 1}: ${firstMissing.title}.`;
      $(`${firstMissing.id}Choice`).focus();
      return;
    }

    const score = stages.reduce((sum, s) => sum + (choices[s.id] === 'correct' ? s.points : 0), 0);
    lastReviewed = score;
    $('totalScore').textContent = `${score}/100`;
    $('scoreFill').style.width = `${score}%`;
    $('reviewMessage').textContent = score === 100
      ? 'You assembled the four expected statements. This code was evaluated against the exercise rubric, not executed.'
      : 'Review the explanations below and revise your selections. The code preview does not guarantee a runnable test.';

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
      explanation.textContent = correct
        ? `Correct. ${stage.guidance}`
        : `Needs revision. ${stage.guidance}`;
      card.append(heading, points, explanation);
      feedback.appendChild(card);
    }
    const progressResult = (
      window.AutomationLabProgress &&
      typeof window.AutomationLabProgress.save === 'function'
    )
      ? window.AutomationLabProgress.save(1, stages, choices)
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
    $('reviewResult').scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  for (const stage of stages) {
    $(`${stage.id}Choice`).addEventListener('change', event => {
      choices[stage.id] = event.target.value;
      clearReviewIfChanged();
      preview();
      saveDraft();
    });
  }

  $('reviewButton').addEventListener('click', review);
  $('resetButton').addEventListener('click', () => {
    if (!window.confirm('Clear the four Automation Lab choices saved in this browser?')) return;
    for (const stage of stages) {
      choices[stage.id] = '';
      $(`${stage.id}Choice`).value = '';
    }
    lastReviewed = null;
    $('reviewResult').hidden = true;
    $('formStatus').textContent = 'Draft cleared. Previously saved My Progress sessions are preserved.';
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* Browser storage unavailable. */ }
    $('draftStatus').textContent = 'Draft cleared';
    preview();
  });
  $('copyCode').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('codePreview').textContent);
      $('copyStatus').textContent = 'Code copied. Run it in a configured Playwright project to execute it.';
    } catch (_) {
      $('copyStatus').textContent = 'Copy unavailable. Select the text in the preview to copy manually.';
    }
  });

  restoreDraft();
  preview();
})();
