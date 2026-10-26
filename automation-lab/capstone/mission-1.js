(() => {
  'use strict';

  const STORAGE_KEY = 'practical-qa-capstone-m1-draft-v1';

  const form = document.getElementById('capstoneM1Form');
  if (!form) return;

  const status = document.getElementById('capstoneM1Status');
  const result = document.getElementById('capstoneM1Result');
  const scoreElement = document.getElementById('capstoneM1Score');
  const feedback = document.getElementById('capstoneM1Feedback');
  const resetButton = document.getElementById('capstoneM1Reset');

  const decisions = [
    {
      id: 'capstoneM1Smoke',
      correct: 'journey',
      title: 'Smoke coverage',
      explanation: 'Prioritise the critical product-to-cart journey and verify the expected KES 4,800 subtotal.'
    },
    {
      id: 'capstoneM1Email',
      correct: 'invalid-email',
      title: 'Checkout validation',
      explanation: 'AC-04 requires coverage of both empty and malformed email inputs.'
    },
    {
      id: 'capstoneM1Release',
      correct: 'block-and-retest',
      title: 'Release readiness',
      explanation: 'A confirmed checkout validation failure needs a defect report, a release decision, and verification after the fix.'
    }
  ];

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
      // Missing or damaged drafts must not prevent usage.
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

    const pointsPerDecision = 5;
    let total = 0;

    feedback.replaceChildren();

    for (const decision of decisions) {
      const correct =
        answers[decision.id] === decision.correct;

      if (correct) total += pointsPerDecision;

      const item = document.createElement('li');

      item.textContent =
        decision.title + ': ' +
        (correct ? '5/5 points. ' : '0/5 points. ') +
        decision.explanation;

      feedback.appendChild(item);
    }

    scoreElement.textContent = `${total}/15`;
    result.hidden = false;

    status.textContent =
      'Mission 1 reviewed. This score is not yet saved to My Progress.';
  });

  resetButton.addEventListener('click', () => {
    for (const decision of decisions) {
      document.getElementById(decision.id).value = '';
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Clear the visible draft even if storage is unavailable.
    }

    result.hidden = true;
    feedback.replaceChildren();
    scoreElement.textContent = '0/15';

    status.textContent = 'Mission 1 draft cleared.';
  });

  restoreDraft();
})();
