(() => {
  'use strict';

  // Dedicated Module 6 draft. Never changes other modules or My Progress.
  const STORAGE_KEY = 'practical-qa-automation-m6-draft-v1';
  const stages = [
    {
      id: 'request', title: 'Fetch the product', points: 20,
      options: {
        wrong1: "const response = request.get('/api/products/42');",
        correct: "const response = await request.get('/api/products/42');",
        wrong2: "const response = await page.goto('/api/products/42');"
      },
      guidance: 'Use await request.get() so response is an APIResponse, not a Promise. page.goto() navigates a browser and is not a substitute for the request fixture.'
    },
    {
      id: 'status', title: 'Successful HTTP status', points: 25,
      options: {
        wrong1: 'expect(response.status()).toBe(201);',
        correct: 'expect(response.status()).toBe(200);',
        wrong2: 'expect(response.ok()).toBeTruthy();'
      },
      guidance: 'The documented status is exactly 200. Status 201 means Created, while response.ok() accepts any successful 2xx response rather than asserting the contract precisely.'
    },
    {
      id: 'body', title: 'Validate the JSON body', points: 25,
      options: {
        wrong1: 'expect(body).toBeTruthy();',
        correct: "expect(body).toMatchObject({ id: 42, name: 'Canvas Backpack' });",
        wrong2: "expect(body.name).toBe('Travel Mug');"
      },
      guidance: 'toMatchObject() verifies both contracted fields while tolerating extra properties. A truthiness check proves too little; Travel Mug is the wrong product.'
    },
    {
      id: 'negative', title: 'Missing product response', points: 30,
      options: {
        wrong1: 'expect(missing.status()).toBe(200);',
        correct: 'expect(missing.status()).toBe(404);',
        wrong2: 'expect(missing.ok()).toBeTruthy();'
      },
      guidance: 'A missing product should return exactly 404 Not Found according to this fictional contract. A 200 or a successful response would violate the negative scenario.'
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
    return selectedStatement(stage) || `// Choose code for ${stage.title.toLowerCase()}`;
  }

  function preview() {
    for (const stage of stages) {
      $(`${stage.id}Selected`).textContent = selectedStatement(stage) || 'None yet';
    }
    const code = [
      "import { test, expect } from '@playwright/test';",
      '',
      '// A real project needs a running ShopFlow API and configured baseURL.',
      "test('returns the correct product', async ({ request }) => {",
      `  ${placeholder('request')}`,
      `  ${placeholder('status')}`,
      '  const body = await response.json();',
      `  ${placeholder('body')}`,
      '});',
      '',
      "test('returns 404 for a missing product', async ({ request }) => {",
      "  const missing = await request.get('/api/products/9999');",
      `  ${placeholder('negative')}`,
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
      ? 'You chose the preferred API tests. This rubric review did not make HTTP requests.'
      : 'Review the explanations and try again. This is a simulated assessment; no HTTP requests were sent.';
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
      ? window.AutomationLabProgress.save(6, stages, choices)
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
    if (!window.confirm('Clear the four Module 6 choices saved in this browser?')) return;
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
      $('copyStatus').textContent = 'Code copied. This fictional API example needs a matching server to run.';
    } catch (_) {
      $('copyStatus').textContent = 'Copy unavailable. Select the preview text to copy manually.';
    }
  });

  restoreDraft();
  preview();
})();
