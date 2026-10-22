(() => {
  'use strict';

  // Module 3 stores only its own answer selections; other modules are untouched.
  const STORAGE_KEY = 'practical-qa-automation-m3-draft-v1';
  const stages = [
    {
      id: 'visible', title: 'Visible profile heading', points: 20,
      options: {
        wrong1: "expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible();",
        correct: "await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeVisible();",
        wrong2: "await expect(page.getByRole('heading', { name: 'Profile settings' })).toBeHidden();"
      },
      guidance: 'Use await with Playwright’s auto-retrying toBeVisible() assertion. Omitting await can let the test finish without waiting for the result; toBeHidden() checks the opposite requirement.'
    },
    {
      id: 'message', title: 'Exact success message', points: 25,
      options: {
        wrong1: "await expect(page.getByRole('status')).toHaveText('Saving profile...');",
        correct: "await expect(page.getByRole('status')).toHaveText('Profile saved');",
        wrong2: "await expect(page.getByRole('status')).toBeVisible();"
      },
      guidance: 'toHaveText() validates the exact expected status text. Saving profile... is not the success message; visibility alone cannot prove that the save succeeded.'
    },
    {
      id: 'url', title: 'Expected profile route', points: 25,
      options: {
        wrong1: 'await expect(page).toHaveURL(/\\/account\\/settings$/);',
        wrong2: 'expect(page).toHaveURL(/\\/account\\/profile$/);',
        correct: 'await expect(page).toHaveURL(/\\/account\\/profile$/);'
      },
      guidance: 'The route must end in /account/profile, and the toHaveURL() assertion must be awaited. The settings route is different from the required final route.'
    },
    {
      id: 'state', title: 'Saved Email updates checkbox', points: 30,
      options: {
        wrong1: "await expect(page.getByRole('checkbox', { name: 'Email updates' })).toBeEnabled();",
        wrong2: "await expect(page.getByRole('checkbox', { name: 'Email updates' })).not.toBeChecked();",
        correct: "await expect(page.getByRole('checkbox', { name: 'Email updates' })).toBeChecked();"
      },
      guidance: 'toBeChecked() confirms the saved checkbox state. toBeEnabled() only checks whether it can be interacted with; not.toBeChecked() expects the wrong state.'
    }
  ];

  const $ = id => document.getElementById(id);
  const choices = Object.fromEntries(stages.map(stage => [stage.id, '']));
  let reviewed = false;

  function selectedStatement(stage) {
    return stage.options[choices[stage.id]] || '';
  }

  function preview() {
    for (const stage of stages) {
      $(`${stage.id}Selected`).textContent = selectedStatement(stage) || 'None yet';
    }
    const statement = id => {
      const stage = stages.find(s => s.id === id);
      return selectedStatement(stage) || `// Choose your ${stage.title.toLowerCase()} statement`;
    };
    const code = [
      "import { test, expect } from '@playwright/test';",
      '',
      "test('validates saved profile settings', async ({ page }) => {",
      "  await page.goto('/account/profile');",
      "  await page.getByRole('button', { name: 'Save profile' }).click();",
      '',
      `  ${statement('visible')}`,
      `  ${statement('message')}`,
      `  ${statement('url')}`,
      `  ${statement('state')}`,
      '});'
    ].join('\n');
    $('codePreview').textContent = code;
    $('completedCount').textContent = `${stages.filter(s => choices[s.id]).length}/4`;
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
        const choice = saved.choices[stage.id];
        if (typeof choice !== 'string' || !Object.prototype.hasOwnProperty.call(stage.options, choice)) continue;
        choices[stage.id] = choice;
        $(`${stage.id}Choice`).value = choice;
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
      ? 'You chose the preferred assertions for this fictional scenario. This rubric review did not execute Playwright.'
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
      ? window.AutomationLabProgress.save(3, stages, choices)
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
    if (!window.confirm('Clear the four Module 3 choices saved in this browser?')) return;
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
