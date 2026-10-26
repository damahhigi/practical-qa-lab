(() => {
  'use strict';

  const STORAGE_KEY = 'practical-qa-capstone-m4-draft-v1';
  const decisions = [
  {
    "id": "capstoneM4Boundaries",
    "correct": "edges",
    "title": "Select quantity boundary coverage",
    "explanation": "Check valid boundaries 1 and 5 and invalid values 0 and 6. This covers the edges of ShopFlow's five-unit stock limit."
  },
  {
    "id": "capstoneM4CartState",
    "correct": "unchanged",
    "title": "Verify rejected quantity behaviour",
    "explanation": "AC-03 requires rejection without changing the cart. Verify the error and ensure quantity and subtotal retain valid values."
  },
  {
    "id": "capstoneM4Email",
    "correct": "both",
    "title": "Test checkout email validation",
    "explanation": "Test both empty and malformed inputs independently and assert the appropriate validation feedback for each."
  }
];

  const form = document.getElementById('capstoneM4Form');
  if (!form) return;

  const status = document.getElementById('capstoneM4Status');
  const result = document.getElementById('capstoneM4Result');
  const score = document.getElementById('capstoneM4Score');
  const feedback = document.getElementById('capstoneM4Feedback');
  const reset = document.getElementById('capstoneM4Reset');

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

      if (!saved || typeof saved !== 'object' ||
          Array.isArray(saved)) return;

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
      // Invalid drafts must not block the assessment.
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
      'Mission 4 reviewed. This score is not yet saved to My Progress.';
  });

  reset.addEventListener('click', () => {
    for (const decision of decisions) {
      document.getElementById(decision.id).value = '';
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Clear visible answers even if storage is unavailable.
    }

    result.hidden = true;
    feedback.replaceChildren();
    score.textContent = '0/15';

    status.textContent = 'Mission 4 draft cleared.';
  });

  restoreDraft();
})();
