(() => {
  'use strict';

  const STORAGE_KEY = 'practical-qa-capstone-m3-draft-v1';
  const decisions = [
  {
    "id": "capstoneM3Heading",
    "correct": "heading",
    "title": "Verify the product heading",
    "explanation": "Assert the visible product heading. The URL or a delay alone cannot prove the expected product is displayed."
  },
  {
    "id": "capstoneM3Price",
    "correct": "price",
    "title": "Verify the exact product price",
    "explanation": "Check the rendered unit price with an exact text match. Comparing two constants does not test the application."
  },
  {
    "id": "capstoneM3Quantity",
    "correct": "value",
    "title": "Verify the cart quantity",
    "explanation": "Use toHaveValue for an input element. toHaveText checks text content, not the current input value."
  },
  {
    "id": "capstoneM3Subtotal",
    "correct": "subtotal",
    "title": "Verify the calculated subtotal",
    "explanation": "Assert the calculated subtotal within the Cart summary. The unit price or cart URL alone cannot verify the total."
  }
];

  const form = document.getElementById('capstoneM3Form');
  if (!form) return;

  const status = document.getElementById('capstoneM3Status');
  const result = document.getElementById('capstoneM3Result');
  const score = document.getElementById('capstoneM3Score');
  const feedback = document.getElementById('capstoneM3Feedback');
  const reset = document.getElementById('capstoneM3Reset');

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
        'Choose an answer for all four decisions before reviewing.';
      return;
    }

    let total = 0;
    feedback.replaceChildren();

    for (const decision of decisions) {
      const correct = answers[decision.id] === decision.correct;

      if (correct) total += 5;

      const item = document.createElement('li');

      item.textContent =
        decision.title + ': ' +
        (correct ? '5/5 points. ' : '0/5 points. ') +
        decision.explanation;

      feedback.appendChild(item);
    }

    score.textContent = `${total}/20`;
    result.hidden = false;

    status.textContent =
      'Mission 3 reviewed. This score is not yet saved to My Progress.';
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
    score.textContent = '0/20';

    status.textContent = 'Mission 3 draft cleared.';
  });

  restoreDraft();
})();
