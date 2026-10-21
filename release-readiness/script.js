(() => {
  'use strict';

  // Stage 7, Part 2. Fictional training data; saved drafts and My Progress are browser-local.
  const DRAFT_KEY = 'practical-qa-release-readiness-draft-v1';
  const PROGRESS_KEY = 'practicalQaLab.progress.v1';
  const PROGRESS_HISTORY_LIMIT = 250;
  const RELEASE_AREA = 'releasereadiness';
  const FIELD_IDS = ['triagePay', 'triageOrder', 'triageAuth', 'triageUi'];
  const ISSUE_RULES = [
    { key: 'pay', id: 'PAY-214', correct: 'block', points: 18, explanation: 'An unresolved critical duplicate-charge defect is a hard release blocker under this policy.' },
    { key: 'order', id: 'ORD-337', correct: 'block', points: 12, explanation: 'The paid-order visibility defect remains open, and its proposed workaround has not been verified.' },
    { key: 'auth', id: 'AUTH-122', correct: 'retest', points: 10, explanation: 'Engineering has provided a fix, but QA must retest and attach evidence before sign-off.' },
    { key: 'ui', id: 'UI-052', correct: 'defer', points: 5, explanation: 'The impact is limited, and the product owner has explicitly approved its deferral.' }
  ];
  const ACTION_RULES = [
    { key: 'payment', points: 8 },
    { key: 'coverage', points: 8 },
    { key: 'auth', points: 5 },
    { key: 'rollback', points: 4 }
  ];
  const UNSAFE_ACTIONS = ['ship', 'ignore'];

  const form = document.getElementById('signoffForm');
  const saveStatus = document.getElementById('saveStatus');
  const formError = document.getElementById('formError');
  const reviewSection = document.getElementById('reviewResult');
  const reviewScore = document.getElementById('reviewScore');
  const reviewSummary = document.getElementById('reviewSummary');
  const reviewMeter = document.getElementById('reviewMeter');
  const feedbackGrid = document.getElementById('feedbackGrid');
  const rationale = document.getElementById('rationale');
  const characterCount = document.getElementById('characterCount');
  const progressStatus = document.getElementById('progressSaveStatus');
  if (!form) return;

  let savedReview = null;
  let storageAvailable = true;

  function draftFromForm() {
    const chosenDecision = form.querySelector('input[name="decision"]:checked');
    return {
      decision: chosenDecision?.value || '',
      triage: {
        pay: document.getElementById('triagePay').value,
        order: document.getElementById('triageOrder').value,
        auth: document.getElementById('triageAuth').value,
        ui: document.getElementById('triageUi').value
      },
      actions: Array.from(form.querySelectorAll('input[name="actions"]:checked'), node => node.value),
      rationale: rationale.value
    };
  }

  function signatureOf(draft) { return JSON.stringify(draft); }

  function restoreDraft() {
    let payload;
    try { payload = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); }
    catch (_) { saveStatus.textContent = 'Saved draft could not be read. Existing data was not replaced.'; return; }
    if (!payload || payload.version !== 1 || !payload.draft || typeof payload.draft !== 'object') return;
    const draft = payload.draft;
    if (['go', 'conditional', 'no-go'].includes(draft.decision)) {
      const node = form.querySelector(`input[name="decision"][value="${draft.decision}"]`);
      if (node) node.checked = true;
    }
    if (draft.triage && typeof draft.triage === 'object') {
      ISSUE_RULES.forEach(({ key }, index) => {
        const value = draft.triage[key];
        if (['block', 'retest', 'defer'].includes(value)) document.getElementById(FIELD_IDS[index]).value = value;
      });
    }
    if (Array.isArray(draft.actions)) {
      form.querySelectorAll('input[name="actions"]').forEach(node => { node.checked = draft.actions.includes(node.value); });
    }
    if (typeof draft.rationale === 'string') rationale.value = draft.rationale.slice(0, 1800);
    if (payload.review && payload.review.signature === signatureOf(draftFromForm())) {
      savedReview = payload.review;
    }
    saveStatus.textContent = 'Draft restored from this browser';
  }

  function saveDraft() {
    const draft = draftFromForm();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ version: 1, draft, review: savedReview }));
      storageAvailable = true;
      saveStatus.textContent = 'Draft saved on this device';
    } catch (_) {
      storageAvailable = false;
      saveStatus.textContent = 'Browser storage unavailable · draft may not survive refresh';
    }
  }

  // Stable fingerprint of the submitted answers. Repeating an unchanged submission
  // cannot create duplicate progress sessions, even after refresh or clearing a draft.
  function reviewSessionId(draft) {
    const snapshot = signatureOf(draft);
    let a = 2166136261;
    let b = 5381;
    for (let i = 0; i < snapshot.length; i++) {
      const code = snapshot.charCodeAt(i);
      a = Math.imul(a ^ code, 16777619) >>> 0;
      b = (Math.imul(b, 33) ^ code) >>> 0;
    }
    return `release-readiness-${a.toString(16).padStart(8, '0')}-${b.toString(16).padStart(8, '0')}`;
  }

  // Use precisely the same session schema as the homepage's My Progress dashboard.
  // Reject unexpected storage formats rather than risking data loss.
  function saveReviewToProgress(draft, review) {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      const history = raw === null ? [] : JSON.parse(raw);
      if (!Array.isArray(history)) {
        return 'My Progress has an unexpected storage format; existing data was not changed.';
      }
      const id = reviewSessionId(draft);
      if (history.some(item => item && item.id === id)) {
        return 'This unchanged review is already in My Progress. No duplicate was added.';
      }
      const session = {
        id,
        type: 'challenge',
        area: RELEASE_AREA,
        score: review.score,
        maxScore: 100,
        completedAt: new Date().toISOString(),
        questionScores: review.feedback.map(item => item.got)
      };
      localStorage.setItem(PROGRESS_KEY,
        JSON.stringify([session, ...history].slice(0, PROGRESS_HISTORY_LIMIT)));
      return '✓ Release Readiness score saved to My Progress. Open the homepage to see it.';
    } catch (_) {
      return 'Your feedback is ready, but My Progress could not be saved. Check browser storage settings.';
    }
  }

  function existingReviewProgressMessage(draft) {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      const history = raw ? JSON.parse(raw) : [];
      if (Array.isArray(history) && history.some(item => item && item.id === reviewSessionId(draft))) {
        return '✓ This review is already saved in My Progress.';
      }
    } catch (_) { /* A failed read never changes saved drafts or sessions. */ }
    return 'Finish the challenge again to record this review in My Progress.';
  }

  function addFeedback(title, pointsEarned, maxPoints, explanation, passed) {
    const article = document.createElement('article');
    article.className = `feedback-card ${passed ? 'good' : 'needs-work'}`;
    const heading = document.createElement('h4');
    heading.textContent = title;
    const result = document.createElement('p');
    result.className = 'feedback-mark';
    result.textContent = `${passed ? '✓' : '○'} ${pointsEarned}/${maxPoints} points`;
    const note = document.createElement('p');
    note.textContent = explanation;
    article.append(heading, result, note);
    feedbackGrid.appendChild(article);
  }

  function evaluate(draft) {
    const feedback = [];
    let total = 0;
    const decisionOkay = draft.decision === 'no-go';
    total += decisionOkay ? 25 : 0;
    feedback.push({
      title: 'Release recommendation', got: decisionOkay ? 25 : 0, max: 25, passed: decisionOkay,
      explanation: decisionOkay
        ? 'NO-GO is appropriate at this moment because the release gates are not met.'
        : 'The training policy requires zero open critical payment defects and verified critical-flow testing. Conditions to be completed later do not authorize shipping now.'
    });

    ISSUE_RULES.forEach(rule => {
      const passed = draft.triage[rule.key] === rule.correct;
      const got = passed ? rule.points : 0;
      total += got;
      feedback.push({ title: `${rule.id} disposition`, got, max: rule.points, passed, explanation: rule.explanation });
    });

    const correctActions = ACTION_RULES.filter(rule => draft.actions.includes(rule.key));
    const unsafeActions = UNSAFE_ACTIONS.filter(key => draft.actions.includes(key));
    const earned = correctActions.reduce((sum, rule) => sum + rule.points, 0);
    const penalty = unsafeActions.length * 5;
    const actionsPoints = Math.max(0, earned - penalty);
    total += actionsPoints;
    const allActionsGood = correctActions.length === ACTION_RULES.length && unsafeActions.length === 0;
    feedback.push({
      title: 'Required release actions', got: actionsPoints, max: 25, passed: allActionsGood,
      explanation: allActionsGood
        ? 'You included payment regression, incomplete-test disposition, recovery-flow retesting, and rollback planning without accepting unsafe shortcuts.'
        : `Recommended: verify payment retry fixes, disposition failed/blocked/not-run tests, retest password resets, and confirm rollback readiness.${unsafeActions.length ? ' Production monitoring or a high pass rate cannot replace the missing release gates.' : ''}`
    });

    const text = draft.rationale.toLowerCase();
    const mentionsPayment = /pay(?:ment|ments)?|duplicat|charg|financial|critical/.test(text);
    const mentionsCoverage = /block(?:ed|ing)?|fail(?:ed|ure)?|not.run|test(?:ing|s)?|retest|evidence|cover(?:age)?/.test(text);
    const rationalePoints = (mentionsPayment ? 2 : 0) + (mentionsCoverage ? 3 : 0);
    total += rationalePoints;
    feedback.push({
      title: 'Evidence-based rationale', got: rationalePoints, max: 5, passed: rationalePoints === 5,
      explanation: rationalePoints === 5
        ? 'Your explanation references payment risk and testing evidence. A human reviewer would additionally assess your logic and clarity.'
        : 'Make your rationale specific: mention the duplicate-charge risk and the unverified/unfinished testing or retesting evidence.'
    });
    return { score: Math.max(0, Math.min(100, total)), feedback };
  }

  function renderReview(review, shouldScroll) {
    if (!review || !Array.isArray(review.feedback)) return;
    reviewScore.textContent = `${review.score}/100`;
    reviewMeter.style.width = `${review.score}%`;
    reviewSummary.textContent = review.score >= 85
      ? 'Strong evidence-based release reasoning for this fictional case.'
      : 'Review the release gates and the specific evidence you may have missed.';
    feedbackGrid.replaceChildren();
    review.feedback.forEach(item => addFeedback(item.title, item.got, item.max, item.explanation, item.passed));
    reviewSection.hidden = false;
    if (shouldScroll) {
      reviewSection.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      reviewSection.focus({ preventScroll: true });
    }
  }

  function onFormChange() {
    // Do not retain stale feedback after any answer changes.
    savedReview = null;
    reviewSection.hidden = true;
    if (progressStatus) progressStatus.textContent = '';
    const guide = reviewSection.querySelector('details');
    if (guide) guide.open = false;
    formError.hidden = true;
    characterCount.textContent = String(rationale.value.length);
    saveDraft();
  }

  form.addEventListener('input', onFormChange);
  form.addEventListener('change', onFormChange);

  form.addEventListener('submit', event => {
    event.preventDefault();
    formError.hidden = true;
    if (!form.checkValidity()) {
      formError.textContent = 'Please choose a release decision, classify all four defects, and write at least 30 characters explaining your decision.';
      formError.hidden = false;
      const firstInvalid = form.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }
    const draft = draftFromForm();
    const review = evaluate(draft);
    savedReview = { ...review, signature: signatureOf(draft) };
    saveDraft();
    renderReview(savedReview, true);
    if (progressStatus) progressStatus.textContent = saveReviewToProgress(draft, savedReview);
    if (storageAvailable) saveStatus.textContent = 'Review saved on this device';
  });

  document.getElementById('resetButton').addEventListener('click', () => {
    if (!window.confirm('Clear your release recommendation draft and feedback on this device? This will not affect other lab progress.')) return;
    form.reset();
    savedReview = null;
    reviewSection.hidden = true;
    if (progressStatus) progressStatus.textContent = '';
    formError.hidden = true;
    characterCount.textContent = '0';
    saveDraft();
    saveStatus.textContent = 'Draft cleared';
  });

  restoreDraft();
  characterCount.textContent = String(rationale.value.length);
  if (savedReview) {
    renderReview(savedReview, false);
    if (progressStatus) progressStatus.textContent = existingReviewProgressMessage(draftFromForm());
  }
})();
