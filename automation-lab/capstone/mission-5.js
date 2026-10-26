(() => {
  'use strict';

  const STORAGE_KEY = 'practical-qa-capstone-m5-draft-v1';
  const decisions = [
  {
    "id": "capstoneM5Waiting",
    "correct": "retry-assertion",
    "title": "Replace a fixed timeout",
    "explanation": "Playwright's web-first assertions automatically retry until the condition succeeds or times out. A fixed delay adds unnecessary waiting and does not prove the application behaved correctly."
  },
  {
    "id": "capstoneM5Locator",
    "correct": "scoped-role",
    "title": "Repair a fragile locator",
    "explanation": "Scope the Add to cart button to the named product article. Accessible roles and names are less dependent on element positions."
  },
  {
    "id": "capstoneM5Isolation",
    "correct": "isolated-state",
    "title": "Eliminate shared test-data interference",
    "explanation": "Tests should use isolated, predictable data and restore their own initial conditions. This reduces cross-test interference and improves parallel execution reliability."
  }
];

  const form = document.getElementById('capstoneM5Form');
  if (!form) return;

  const status = document.getElementById('capstoneM5Status');
  const result = document.getElementById('capstoneM5Result');
  const score = document.getElementById('capstoneM5Score');
  const feedback = document.getElementById('capstoneM5Feedback');
  const reset = document.getElementById('capstoneM5Reset');

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
      'Mission 5 reviewed. This score is not yet saved to My Progress.';
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

    status.textContent = 'Mission 5 draft cleared.';
  });

  restoreDraft();
})();
