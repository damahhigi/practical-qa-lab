(() => {
  'use strict';

  // A unique storage key prevents this module from touching Module 1 drafts.
  const STORAGE_KEY = 'practical-qa-automation-m2-draft-v1';
  const stages = [
    {
      id: 'link', title: 'Account settings link', points: 20,
      options: {
        wrong1: "await page.locator('a').first().click();",
        correct: "await page.getByRole('link', { name: 'Account settings' }).click();",
        wrong2: "await page.getByText('Account settings').click();"
      },
      guidance: 'Prefer getByRole with a link and its accessible name. A generic first() selector depends on page order, and getByText does not explicitly constrain the element to a link.'
    },
    {
      id: 'email', title: 'Email address input', points: 25,
      options: {
        wrong1: "await page.getByPlaceholder('Email address').fill('qa@example.com');",
        wrong2: "await page.locator('input').first().fill('qa@example.com');",
        correct: "await page.getByLabel('Email address').fill('qa@example.com');"
      },
      guidance: 'The sample field has a visible label but no placeholder. getByLabel uses the label/input association without depending on input order.'
    },
    {
      id: 'scoped', title: 'Scoped Save changes button', points: 30,
      options: {
        wrong1: "await page.getByRole('button', { name: 'Save changes' }).click();",
        correct: "await page.getByRole('region', { name: 'Account details' }).getByRole('button', { name: 'Save changes' }).click();",
        wrong2: "await page.getByRole('button', { name: 'Save changes' }).last().click();"
      },
      guidance: 'Both sections contain Save changes buttons. Restricting the search to the named Account details region selects the intended one. Without scoping, the locator matches two buttons.'
    },
    {
      id: 'status', title: 'Confirmation status assertion', points: 25,
      options: {
        wrong1: "expect(page.getByRole('status')).toHaveText('Changes saved');",
        wrong2: "await expect(page.getByRole('status')).toBeHidden();",
        correct: "await expect(page.getByRole('status')).toHaveText('Changes saved');"
      },
      guidance: 'await the auto-retrying toHaveText assertion on the status role. Without await, a failed expectation may not be awaited before the test finishes; toBeHidden checks the opposite outcome.'
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
      "test('updates account email', async ({ page }) => {",
      "  await page.goto('/');",
      `  ${statement('link')}`,
      `  ${statement('email')}`,
      `  ${statement('scoped')}`,
      `  ${statement('status')}`,
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
      ? 'You chose the preferred locators for the fictional scenario. This rubric review did not execute Playwright.'
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
      ? window.AutomationLabProgress.save(2, stages, choices)
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
    if (!window.confirm('Clear the four Module 2 choices saved in this browser?')) return;
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
