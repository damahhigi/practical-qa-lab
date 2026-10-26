(() => {
  'use strict';

  const STORAGE_KEY = 'practical-qa-capstone-m2-draft-v1';
  const decisions = [
  {
    "id": "capstoneM2Product",
    "correct": "role",
    "title": "Locate the correct product",
    "explanation": "Use an accessible heading role and the product's specific name instead of a positional or vague locator."
  },
  {
    "id": "capstoneM2Cart",
    "correct": "role",
    "title": "Add the product to the cart",
    "explanation": "Locate the action by its accessible button name rather than its position or an arbitrary delay."
  },
  {
    "id": "capstoneM2Quantity",
    "correct": "label",
    "title": "Update the cart quantity",
    "explanation": "Use the visible input label and set quantity two. This quantity is within the five-unit stock limit."
  },
  {
    "id": "capstoneM2Subtotal",
    "correct": "subtotal",
    "title": "Verify the cart subtotal",
    "explanation": "Assert the expected subtotal in the cart summary. Navigation alone or the unit price does not prove that the quantity and subtotal are correct."
  }
];

  const form = document.getElementById('capstoneM2Form');
  if (!form) return;

  const status = document.getElementById('capstoneM2Status');
  const result = document.getElementById('capstoneM2Result');
  const score = document.getElementById('capstoneM2Score');
  const feedback = document.getElementById('capstoneM2Feedback');
  const reset = document.getElementById('capstoneM2Reset');

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

        if (typeof value === 'string' &&
            Array.from(select.options).some(
              option => option.value === value
            )) {
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
      'Mission 2 reviewed. This score is not yet saved to My Progress.';
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
    status.textContent = 'Mission 2 draft cleared.';
  });

  restoreDraft();
})();
