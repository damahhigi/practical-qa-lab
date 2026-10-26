(() => {
  'use strict';

  const STORAGE_KEY = 'practical-qa-capstone-m6-draft-v1';
  const decisions = [
  {
    "id": "capstoneM6Request",
    "correct": "get",
    "title": "Send the product API request",
    "explanation": "Use request.get with /api/products/42. The endpoint represents an existing product and is expected to return HTTP 200."
  },
  {
    "id": "capstoneM6Contract",
    "correct": "contract",
    "title": "Validate the product API contract",
    "explanation": "Verify HTTP 200 and inspect the parsed response body for id 42, name Canvas Backpack, and priceKES 2400. A status-only check cannot validate the response contract."
  },
  {
    "id": "capstoneM6Missing",
    "correct": "not-found",
    "title": "Verify a missing resource",
    "explanation": "Request the nonexistent product and assert HTTP 404. Negative API tests help confirm that missing resources are handled correctly."
  }
];

  const form = document.getElementById('capstoneM6Form');
  if (!form) return;

  const status = document.getElementById('capstoneM6Status');
  const result = document.getElementById('capstoneM6Result');
  const score = document.getElementById('capstoneM6Score');
  const feedback = document.getElementById('capstoneM6Feedback');
  const reset = document.getElementById('capstoneM6Reset');

  function getAnswers() {
    const answers = {};

    for (const decision of decisions) {
      answers[decision.id] =
        document.getElementById(decision.id).value;
    }

    return answers;
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(getAnswers())
      );
      return true;
    } catch (_) {
      return false;
    }
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const saved = JSON.parse(raw);

      if (
        !saved ||
        typeof saved !== 'object' ||
        Array.isArray(saved)
      ) return;

      for (const decision of decisions) {
        const select = document.getElementById(decision.id);
        const value = saved[decision.id];

        if (
          typeof value === 'string' &&
          Array.from(select.options).some(
            option => option.value === value
          )
        ) {
          select.value = value;
        }
      }
    } catch (_) {
      // Invalid drafts must not break the assessment.
    }
  }

  for (const decision of decisions) {
    document.getElementById(decision.id)
      .addEventListener('change', () => {
        result.hidden = true;

        status.textContent = saveDraft()
          ? 'Draft saved in this browser. Review when ready.'
          : 'Answers selected, but browser draft storage is unavailable.';
      });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();

    const answers = getAnswers();

    if (decisions.some(decision => !answers[decision.id])) {
      result.hidden = true;

      status.textContent =
        'Choose an answer for all three decisions before reviewing.';

      return;
    }

    let total = 0;
    feedback.replaceChildren();

    for (const decision of decisions) {
      const correct =
        answers[decision.id] === decision.correct;

      if (correct) total += 5;

      const item = document.createElement('li');

      item.textContent =
        decision.title + ': ' +
        (correct ? '5/5 points. ' : '0/5 points. ') +
        decision.explanation;

      feedback.appendChild(item);
    }

    score.textContent = `${total}/15`;
    result.hidden = false;

    status.textContent =
      'Mission 6 reviewed. This score is not yet saved to My Progress.';
  });

  reset.addEventListener('click', () => {
    for (const decision of decisions) {
      document.getElementById(decision.id).value = '';
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Clear visible selections if storage is unavailable.
    }

    result.hidden = true;
    feedback.replaceChildren();
    score.textContent = '0/15';

    status.textContent = 'Mission 6 draft cleared.';
  });

  restoreDraft();
})();
