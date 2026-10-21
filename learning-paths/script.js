(() => {
  'use strict';
  // Stage 6: read-only view over the existing My Progress history.
  // Do NOT write learning-path state into localStorage; the existing session format stays unchanged.
  const PROGRESS_KEY = 'practicalQaLab.progress.v1';
  const PATHS = {
    beginner: {
      name: 'Beginner QA',
      description: 'Begin with core testing practice, then write a test case and finish with SQL scenario questions.',
      steps: [
        { type: 'practice', area: 'manual', title: 'Manual QA', description: 'Practice identifying defects, prioritizing tests and investigating common product issues.', url: '../?qa-practice=manual', link: 'Start Manual QA' },
        { type: 'challenge', area: 'testcase', title: 'Test Case Writing Lab', description: 'Write a structured test case and submit it for review.', url: '../test-case-lab/', link: 'Open Test Case Writing Lab' },
        { type: 'practice', area: 'sql', title: 'SQL Testing Questions', description: 'Practice SQL validation questions. For extra query practice, visit SQL Validation Lab.', url: '../?qa-practice=sql', link: 'Start SQL Testing Questions' }
      ]
    },
    intermediate: {
      name: 'Intermediate QA',
      description: 'Apply your API and data investigation knowledge in realistic defect-finding challenges.',
      steps: [
        { type: 'practice', area: 'api', title: 'API Testing Questions', description: 'Answer practical API troubleshooting questions. The separate API Testing Lab is also available for simulator practice.', url: '../?qa-practice=api', link: 'Start API Testing Questions' },
        { type: 'challenge', area: 'sqlvalidation', title: 'SQL Validation Lab', description: 'Run SQL investigations, document data-quality defects and finish the review.', url: '../sql-validation-lab/', link: 'Open SQL Validation Lab' },
        { type: 'challenge', area: 'checkout', title: 'Checkout Bug Hunt', description: 'Explore an e-commerce checkout, report defects and assess your findings.', url: '../checkout-bug-hunt/', link: 'Open Checkout Bug Hunt' },
        { type: 'challenge', area: 'apibughunt', title: 'API Bug Hunt', description: 'Find and report API contract and data-behavior defects.', url: '../api-bug-hunt/', link: 'Open API Bug Hunt' },
        { type: 'challenge', area: 'bugtriage', title: 'Bug Triage & Defect Management Lab', description: 'Investigate five defects, assess severity and priority, recommend actions and review your triage decisions.', url: '../bug-triage/', link: 'Open Bug Triage Lab' },
        { type: 'challenge', area: 'releasereadiness', title: 'Release Readiness Challenge', description: 'Evaluate regression results and outstanding defects, then make an evidence-based Go / No-Go release recommendation.', url: '../release-readiness/', link: 'Open Release Readiness Challenge' }
      ]
    },
    interview: {
      name: 'QA Interview Prep',
      description: 'Build confidence with progressive mock interviews and review your responses over time.',
      steps: [
        { type: 'interview', area: 'junior', title: 'Junior QA Mock Interview', description: 'Practice core testing vocabulary and everyday test scenarios.', url: '../?qa-interview=junior', link: 'Start Junior mock interview' },
        { type: 'interview', area: 'mid', title: 'Mid-Level QA Mock Interview', description: 'Practice release risk, prioritization, and collaboration questions.', url: '../?qa-interview=mid', link: 'Start Mid-Level mock interview' },
        { type: 'interview', area: 'senior', title: 'Senior QA Mock Interview', description: 'Explore broader quality strategy and complex QA decisions.', url: '../?qa-interview=senior', link: 'Start Senior mock interview' }
      ]
    }
  };

  const $ = id => document.getElementById(id);
  let selectedPath = 'beginner';
  function readHistory() {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (!raw) return { sessions: [], status: 'empty' };
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return { sessions: [], status: 'invalid' };
      const sessions = parsed.filter(s => s && typeof s.type === 'string' && typeof s.area === 'string'
        && Number.isFinite(s.score) && Number.isFinite(s.maxScore) && s.maxScore > 0
        && s.score >= 0 && s.score <= s.maxScore && typeof s.completedAt === 'string');
      return { sessions: sessions.slice(0, 250), status: 'ok' };
    } catch (error) {
      return { sessions: [], status: 'unavailable' };
    }
  }
  const matches = (s, step) => s.type === step.type && s.area === step.area;
  const countSteps = (path, sessions) => path.steps.filter(step => sessions.some(s => matches(s, step))).length;
  const percent = (score, maxScore) => Math.round(100 * score / maxScore);
  function mostRelevantPath(sessions) {
    const recent = [...sessions]
      .filter(session => Number.isFinite(Date.parse(session.completedAt)))
      .sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
    const preferred = recent.map(session => Object.keys(PATHS).find(key =>
      PATHS[key].steps.some(step => matches(session, step)))).find(Boolean);
    if (preferred && countSteps(PATHS[preferred], sessions) < PATHS[preferred].steps.length) return preferred;
    return Object.keys(PATHS).find(key => countSteps(PATHS[key], sessions) < PATHS[key].steps.length) || 'beginner';
  }
  // Preserve an explicitly selected path through the page URL.
  // No learning-path state is written to browser storage.
  const requestedPath = new URLSearchParams(
    window.location.search
  ).get('path');

  const validRequestedPath = requestedPath !== null &&
    Object.prototype.hasOwnProperty.call(PATHS, requestedPath);

  let pathChosenByUser = validRequestedPath;

  if (validRequestedPath) selectedPath = requestedPath;
  function render() {
    const { sessions, status } = readHistory();
    const historyStatus = $('historyStatus');
    if (status === 'unavailable') historyStatus.textContent = 'Browser progress is unavailable. You can still explore every learning path.';
    else if (status === 'invalid') historyStatus.textContent = 'Saved progress was not in the expected format. No data has been changed.';
    else if (sessions.length === 0) historyStatus.textContent = 'No saved practice sessions yet. Choose any path to begin. Your progress will update after a session is saved.';
    else historyStatus.textContent = `${sessions.length} saved ${sessions.length === 1 ? 'practice session' : 'practice sessions'} found. Your path activity counts are based on those sessions.`;

    // On first load, recommend the path connected to the latest saved activity.
    // Subsequent explicit selections stay in place while the page is open.
    if (!pathChosenByUser) selectedPath = mostRelevantPath(sessions);

    for (const [key, path] of Object.entries(PATHS)) {
      const completed = countSteps(path, sessions);
      const progress = Math.round(100 * completed / path.steps.length);
      document.querySelector(`[data-path-count="${key}"]`).textContent = `${completed} of ${path.steps.length} activities`;
      document.querySelector(`[data-path-percent="${key}"]`).textContent = `${progress}%`;
      document.querySelector(`[data-path-meter="${key}"]`).style.width = `${progress}%`;
      const button = document.querySelector(`[data-path="${key}"]`);
      button.setAttribute('aria-pressed', String(selectedPath === key));
    }

    const path = PATHS[selectedPath];
    const completed = countSteps(path, sessions);
    const progress = Math.round(100 * completed / path.steps.length);
    $('detailsTitle').textContent = path.name;
    $('detailsDescription').textContent = path.description;
    $('detailsCount').textContent = `${completed}/${path.steps.length}`;
    $('detailsMeter').style.width = `${progress}%`;
    $('detailsProgressBar').setAttribute('aria-valuenow', String(progress));
    const next = path.steps.find(step => !sessions.some(s => matches(s, step)));
    $('nextStep').textContent = next ? `Suggested next activity: ${next.title}` : 'Every activity in this path has a saved session. You can revisit any one to improve your score.';
    // Prominent next-activity shortcut; the same fixed target appears in the step list below.
    const suggested = next || path.steps[0];
    const nextPosition = next ? path.steps.indexOf(next) + 1 : null;

    $('continuePath').textContent = path.name;
    $('continueTitle').textContent = next ? suggested.title : 'All activities recorded';

    $('continueDescription').textContent = next
      ? `${suggested.description} You can complete activities in any order.`
      : `Every activity in ${path.name} has a saved session. Revisit an activity to practise and improve your score.`;

    $('continueStatus').textContent = next
      ? `Step ${nextPosition} of ${path.steps.length} · ${completed} of ${path.steps.length} recorded · ${progress}%`
      : `All ${path.steps.length} activities recorded · 100% of steps recorded`;
    $('continueLink').href = suggested.url;
    $('continueLink').textContent = next ? `Continue to ${suggested.title} →` : `Practise ${suggested.title} again →`;

    const list = $('stepList');
    list.replaceChildren();
    path.steps.forEach((step, idx) => {
      const history = sessions.filter(s => matches(s, step));
      const done = history.length > 0;
      const li = document.createElement('li');
      li.className = `step${done ? ' done' : ''}`;
      const number = document.createElement('span');
      number.className = 'step-number';
      number.setAttribute('aria-hidden', 'true');
      number.textContent = done ? '✓' : String(idx + 1);
      const main = document.createElement('div');
      main.className = 'step-main';
      const head = document.createElement('div');
      head.className = 'step-head';
      const title = document.createElement('h3');
      title.textContent = step.title;
      const state = document.createElement('span');
      state.className = 'step-state';
      const best = done ? Math.max(...history.map(s => percent(s.score, s.maxScore))) : null;
      state.textContent = done ? `Session recorded · best ${best}%` : 'Not recorded yet';
      head.append(title, state);
      const description = document.createElement('p');
      description.textContent = step.description;
      const anchor = document.createElement('a');
      anchor.className = 'step-link';
      anchor.href = step.url;
      anchor.textContent = step.link;
      main.append(head, description, anchor);
      li.append(number, main);
      list.appendChild(li);
    });
  }
  document.querySelectorAll('[data-path]').forEach(button => {
    button.addEventListener('click', () => {
      selectedPath = button.dataset.path;
      pathChosenByUser = true;

      // Update the URL without navigating or reloading.
      const url = new URL(window.location.href);
      url.searchParams.set('path', selectedPath);
      window.history.replaceState(window.history.state, '', url);

      render();
      $('pathDetails').focus({ preventScroll: true });
      $('pathDetails').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
  window.addEventListener('pageshow', render);
  window.addEventListener('focus', render);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  window.addEventListener('storage', e => { if (e.key === PROGRESS_KEY || e.key === null) render(); });
  render();
})();
