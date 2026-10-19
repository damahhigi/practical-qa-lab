'use strict';

// Training-only simulation. No fetch(), no real API, and no external dependencies.
const STORAGE_KEY = 'pqa_api_bug_hunt_reports_v1';
const SCENARIOS = {
  create: {
    title: 'Create a fictional user',
    requirement: 'A valid POST to /api/users must create a user and return 201 Created, including the new resource ID and a Location header.',
    method: 'POST', path: '/api/users', getPath: '/api/users/103',
    body: { name: 'Amina Otieno', email: 'amina@example.com', role: 'customer', active: true },
    help: 'Send POST, then try a follow-up GET. Examine the status and response headers as well as the returned record.'
  },
  patch: {
    title: 'Update one field only',
    requirement: 'PATCH /api/users/101 must change only fields supplied in the request body. Changing role to admin must not change name, email or active status.',
    method: 'PATCH', path: '/api/users/101', getPath: '/api/users/101',
    body: { role: 'admin' },
    help: 'Send PATCH and then GET. Compare the retrieved record with the original: Jane Wanjiku, jane@example.com, customer, active=true.'
  },
  delete: {
    title: 'Delete an existing user',
    requirement: 'DELETE /api/users/102 should return 204 No Content with an empty body. A subsequent GET /api/users/102 must return 404 Not Found.',
    method: 'DELETE', path: '/api/users/102', getPath: '/api/users/102',
    body: null,
    help: 'Send DELETE, then verify with GET. A successful status code is not enough to prove the record was removed.'
  }
};

const $ = id => document.getElementById(id);
let runtime;
let selectedScenario = 'create';
let reports = [];
let nextReportNumber = 1;
let editingId = null;

function resetRuntime() {
  runtime = {
    users: {
      101: { id: 101, name: 'Jane Wanjiku', email: 'jane@example.com', role: 'customer', active: true },
      102: { id: 102, name: 'Kevin Mwangi', email: 'kevin@example.com', role: 'customer', active: true }
    },
    sent: { create: false, patch: false, delete: false }
  };
}

function json(value) { return JSON.stringify(value, null, 2); }
function headers(extra = {}) {
  return { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Lab-Mode': 'simulated', ...extra };
}
function response(status, reason, body, extraHeaders = {}) {
  return { status, reason, body, headers: headers(extraHeaders) };
}

function selectScenario() {
  selectedScenario = $('scenarioSelect').value;
  const s = SCENARIOS[selectedScenario];
  $('requirementHeading').textContent = s.title;
  $('requirementText').textContent = s.requirement;
  $('primaryRequestLine').textContent = s.method + ' ' + s.path;
  $('primaryRequestBody').textContent = s.body === null ? 'No request body.' : json(s.body);
  $('requestHelp').textContent = s.help;
  $('verifyGet').disabled = !runtime.sent[selectedScenario];
  $('reportScenario').value = selectedScenario;
  clearResponse();
}

function clearResponse() {
  $('responseStatus').textContent = 'No request yet';
  $('responseStatus').className = 'status-badge status-idle';
  $('responseAnnouncement').textContent = 'Send a request to see what the simulated service returns.';
  $('responseBody').textContent = 'Waiting for a request...';
  $('responseHeaders').textContent = 'No response yet.';
  $('lastRequest').textContent = '';
}

function showResponse(method, path, result) {
  $('responseStatus').textContent = result.status + ' ' + result.reason;
  $('responseStatus').className = 'status-badge ' + (result.status < 400 ? 'status-ok' : 'status-error');
  $('responseAnnouncement').textContent = 'Simulated ' + method + ' request complete: ' + result.status + ' ' + result.reason + '.';
  $('lastRequest').textContent = method + ' ' + path + ' · Training-only response';
  $('responseBody').textContent = result.body === null ? 'No response body (HTTP 204 No Content).' : json(result.body);
  $('responseHeaders').textContent = Object.entries(result.headers).map(([key, value]) => key + ': ' + value).join('\n');
}

function sendPrimary() {
  const s = SCENARIOS[selectedScenario];
  runtime.sent[selectedScenario] = true;
  let result;
  if (selectedScenario === 'create') {
    const newUser = { id: 103, ...s.body };
    runtime.users[103] = newUser;
    // Seeded defect: wrong creation status and omitted Location header.
    result = response(200, 'OK', { message: 'User created successfully', data: newUser });
  } else if (selectedScenario === 'patch') {
    const user = runtime.users[101];
    // Seeded defect: PATCH changes an unrelated email field.
    user.role = 'admin';
    user.email = '';
    result = response(200, 'OK', { message: 'User updated successfully', data: { ...user } });
  } else {
    // Seeded defect: DELETE says success but does not remove the user.
    result = { status: 204, reason: 'No Content', body: null, headers: {
      'Content-Length': '0', 'Cache-Control': 'no-store', 'X-Lab-Mode': 'simulated'
    } };
  }
  $('verifyGet').disabled = false;
  showResponse(s.method, s.path, result);
}

function verifyGet() {
  const s = SCENARIOS[selectedScenario];
  const id = Number(s.getPath.split('/').at(-1));
  const user = runtime.users[id];
  const result = user ? response(200, 'OK', { data: { ...user } }) : response(404, 'Not Found', { error: 'Not Found', message: 'No user found with ID ' + id + '.' });
  showResponse('GET', s.getPath, result);
}

function loadReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.format !== 'pqa-api-bug-hunt-reports' || parsed.version !== 1 || !Array.isArray(parsed.reports) || !Number.isSafeInteger(parsed.nextReportNumber)) return;
    reports = parsed.reports.filter(r => r && typeof r.id === 'string' && SCENARIOS[r.scenario] && typeof r.title === 'string' && typeof r.steps === 'string' && typeof r.expected === 'string' && typeof r.actual === 'string' && typeof r.severity === 'string');
    nextReportNumber = Math.max(1, parsed.nextReportNumber);
  } catch (_) {
    $('storageWarning').hidden = false;
  }
}
function persistReports() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ format: 'pqa-api-bug-hunt-reports', version: 1, nextReportNumber, reports }));
    return true;
  } catch (_) {
    $('storageWarning').hidden = false;
    return false;
  }
}
function addDetail(parent, label, content) {
  const p = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = label + ': ';
  p.append(strong, document.createTextNode(content));
  parent.appendChild(p);
}
function renderReports() {
  const list = $('reportList');
  list.replaceChildren();
  $('reportCount').textContent = String(reports.length);
  $('clearReports').hidden = reports.length === 0;
  if (!reports.length) {
    const p = document.createElement('p');
    p.className = 'empty-reports';
    p.textContent = 'No reports saved yet. Investigate a request, then record your first finding.';
    list.appendChild(p);
    refreshReviewButton();
    return;
  }
  reports.forEach(r => {
    const card = document.createElement('article');
    card.className = 'report-item';
    const meta = document.createElement('p');
    meta.className = 'report-meta';
    meta.textContent = r.id + ' · ' + SCENARIOS[r.scenario].title + ' · ' + r.severity;
    const heading = document.createElement('h4');
    heading.textContent = r.title;
    card.append(meta, heading);
    addDetail(card, 'Steps', r.steps);
    addDetail(card, 'Expected', r.expected);
    addDetail(card, 'Actual', r.actual);
    const controls = document.createElement('div');
    controls.className = 'report-buttons';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.textContent = 'Edit';
    edit.setAttribute('aria-label', 'Edit ' + r.id);
    edit.addEventListener('click', () => editReport(r.id));
    const del = document.createElement('button');
    del.type = 'button'; del.textContent = 'Delete';
    del.setAttribute('aria-label', 'Delete ' + r.id);
    del.addEventListener('click', () => deleteReport(r.id));
    controls.append(edit, del);
    card.appendChild(controls);
    list.appendChild(card);
  });
  refreshReviewButton();
}
function editReport(id) {
  const r = reports.find(item => item.id === id);
  if (!r) return;
  editingId = id;
  $('reportScenario').value = r.scenario;
  $('bugTitle').value = r.title;
  $('bugSteps').value = r.steps;
  $('bugExpected').value = r.expected;
  $('bugActual').value = r.actual;
  $('bugSeverity').value = r.severity;
  $('saveReport').textContent = 'Update report';
  $('cancelEdit').hidden = false;
  $('formStatus').textContent = 'Editing ' + id + '.';
  $('bugTitle').focus();
}
function cancelEdit() {
  editingId = null;
  $('bugForm').reset();
  $('reportScenario').value = selectedScenario;
  $('saveReport').textContent = 'Save bug report';
  $('cancelEdit').hidden = true;
}
function deleteReport(id) {
  if (!window.confirm('Delete ' + id + '? This cannot be undone.')) return;
  reports = reports.filter(r => r.id !== id);
  persistReports();
  if (editingId === id) cancelEdit();
  renderReports();
  invalidateReview();
  $('formStatus').textContent = id + ' deleted.';
}
function saveReport(event) {
  event.preventDefault();
  const entry = {
    scenario: $('reportScenario').value,
    title: $('bugTitle').value.trim(),
    steps: $('bugSteps').value.trim(),
    expected: $('bugExpected').value.trim(),
    actual: $('bugActual').value.trim(),
    severity: $('bugSeverity').value
  };
  if (!SCENARIOS[entry.scenario] || !entry.title || !entry.steps || !entry.expected || !entry.actual) {
    $('formStatus').textContent = 'Complete all required fields before saving.';
    return;
  }
  let savedId;
  if (editingId) {
    const index = reports.findIndex(r => r.id === editingId);
    if (index === -1) { cancelEdit(); return; }
    savedId = editingId;
    reports[index] = { ...reports[index], ...entry };
  } else {
    savedId = 'API-' + String(nextReportNumber++).padStart(3, '0');
    reports.push({ id: savedId, ...entry, createdAt: new Date().toISOString() });
  }
  const persisted = persistReports();
  cancelEdit();
  renderReports();
  invalidateReview();
  $('formStatus').textContent = savedId + (persisted ? ' saved in this browser.' : ' saved for this session only; browser storage is unavailable.');
}

// Stage 3: save completed API Bug Hunt reviews in the existing homepage progress format.
// The reports themselves remain in STORAGE_KEY; only scores are copied to progress.
const HOME_PROGRESS_STORAGE_KEY = 'practicalQaLab.progress.v1';
const HOME_PROGRESS_HISTORY_LIMIT = 250;
const HOME_PROGRESS_AREA = 'apibughunt';

// A deterministic review ID prevents another click (or a refresh) from creating
// a duplicate session. Editing any report generates a different review ID.
function reviewSessionId() {
  const snapshot = JSON.stringify([...reports].sort((a, b) => a.id.localeCompare(b.id)));
  let hashA = 2166136261;
  let hashB = 5381;
  for (let i = 0; i < snapshot.length; i++) {
    const char = snapshot.charCodeAt(i);
    hashA = Math.imul(hashA ^ char, 16777619) >>> 0;
    hashB = (Math.imul(hashB, 33) ^ char) >>> 0;
  }
  return 'api-bug-hunt-' + hashA.toString(16).padStart(8, '0') + '-' + hashB.toString(16).padStart(8, '0');
}

function saveReviewToProgress(score, scenarioPoints, documentationScore) {
  try {
    const raw = localStorage.getItem(HOME_PROGRESS_STORAGE_KEY);
    const history = raw === null ? [] : JSON.parse(raw);
    if (!Array.isArray(history)) {
      return { saved: false, message: 'My Progress has an unexpected storage format. Nothing was overwritten; please back up your data.' };
    }
    const id = reviewSessionId();
    if (history.some(item => item && item.id === id)) {
      return { saved: true, message: 'This unchanged review is already saved in My Progress. No duplicate was added.' };
    }
    const session = {
      id, type: 'challenge', area: HOME_PROGRESS_AREA,
      score, maxScore: 100,
      completedAt: new Date().toISOString(),
      questionScores: [...scenarioPoints, documentationScore]
    };
    localStorage.setItem(HOME_PROGRESS_STORAGE_KEY, JSON.stringify([session, ...history].slice(0, HOME_PROGRESS_HISTORY_LIMIT)));
    return { saved: true, message: '✓ Review score saved to My Progress. Return to the homepage and open My Progress to view it.' };
  } catch (_) {
    return { saved: false, message: 'Review feedback is available, but My Progress could not be saved. Check browser storage permissions.' };
  }
}

// Stage 2 review: a transparent, rules-based assessment of report descriptions.
// The original storage key/format remains unchanged, so Stage 1 reports carry over.
const REVIEW_MAX = 100;
const scenarioSequence = ['create', 'patch', 'delete'];

function textHas(text, pattern) { return pattern.test(text.toLowerCase()); }
function assessEvidence(r) {
  const expected = r.expected.toLowerCase();
  const actual = r.actual.toLowerCase();
  const all = [r.title, r.steps, r.expected, r.actual].join(' ').toLowerCase();
  const checks = [];
  if (r.scenario === 'create') {
    checks.push({ points: 12, label: 'Distinguishes expected 201 Created from actual 200 OK',
      passed: textHas(expected, /\b201\b/) && textHas(actual, /\b200\b/) });
    checks.push({ points: 12, label: 'Identifies the missing Location header',
      passed: textHas(expected, /location/) && textHas(actual, /location/) &&
        textHas(actual, /(missing|absent|omitt?ed|no\s+location|without|not\s+(?:present|included|returned|provided))/) });
    checks.push({ points: 6, label: 'Checks the created user with a follow-up GET',
      passed: textHas(all, /\bget\b/) && textHas(actual, /\b(103|created|exists|retriev|200)\b/) });
  } else if (r.scenario === 'patch') {
    checks.push({ points: 14, label: 'Records that the email was cleared or unexpectedly changed',
      passed: textHas(actual, /email|jane@example\.com/) && textHas(actual, /(empty|blank|clear|remov|missing|changed|""|lost)/) });
    checks.push({ points: 10, label: 'Explains that only the supplied role should change',
      passed: textHas(expected, /role|admin|patch/) && textHas(expected, /(only|unchang|remain|retain|preserv|not\s+chang|no\s+other)/) });
    checks.push({ points: 6, label: 'Verifies the unexpected value using GET',
      passed: textHas(all, /\bget\b/) && textHas(actual, /(email|empty|blank|clear|changed)/) });
  } else if (r.scenario === 'delete') {
    checks.push({ points: 14, label: 'Shows expected GET 404 versus actual GET 200',
      passed: textHas(expected, /\b404\b/) && textHas(actual, /\b200\b/) });
    checks.push({ points: 8, label: 'Notes that DELETE reported 204 No Content',
      passed: textHas(actual, /\b204\b/) });
    checks.push({ points: 8, label: 'Confirms the supposedly deleted user is still retrievable',
      passed: textHas(all, /\bget\b/) && textHas(actual, /(still|remain|exist|retriev|return|contain|not\s+delet)/) });
  }
  return { checks, score: checks.filter(c => c.passed).reduce((sum, c) => sum + c.points, 0) };
}

function documentationPoints(r) {
  if (!r) return 0;
  let score = 0;
  if (r.title.trim().length >= 15) score += 2;
  if (r.steps.trim().length >= 50) score += 3;
  if (r.expected.trim().length >= 30) score += 2;
  if (r.actual.trim().length >= 30) score += 2;
  if (['Major', 'Minor', 'Critical'].includes(r.severity)) score += 1;
  return score;
}
function refreshReviewButton() {
  const scenarioCount = new Set(reports.map(r => r.scenario)).size;
  $('reviewReportCount').textContent = scenarioCount + ' of 3 scenarios documented';
  $('finishChallenge').disabled = reports.length === 0;
  if ($('reviewResults').hidden) {
    $('reviewPrompt').textContent = reports.length
      ? 'You have ' + reports.length + ' saved report' + (reports.length === 1 ? '' : 's') + '. Finish when ready. You can review again after editing.'
      : 'Save at least one bug report to enable the review.';
  }
}
function invalidateReview() {
  $('reviewResults').hidden = true;
  $('answerGuide').hidden = true;
  $('answerGuide').open = false;
  $('reviewPrompt').textContent = 'Reports changed. Finish again for updated feedback.';
  $('reviewSaveStatus').textContent = '';
  refreshReviewButton();
}
function scenarioFeedbackCard(scenario, r, scoreInfo) {
  const card = document.createElement('article');
  card.className = 'scenario-feedback-card';
  const h = document.createElement('h4');
  h.textContent = SCENARIOS[scenario].title + ' — ' + (r ? scoreInfo.score + '/30 evidence points' : 'Not documented');
  card.appendChild(h);
  if (!r) {
    const p = document.createElement('p');
    p.textContent = 'No saved report for this scenario. Investigate it and document the defect.';
    card.appendChild(p);
  } else {
    const meta = document.createElement('p');
    meta.className = 'review-report-meta';
    meta.textContent = 'Best matching report: ' + r.id + ' · ' + r.severity;
    card.appendChild(meta);
    const ul = document.createElement('ul');
    scoreInfo.checks.forEach(check => {
      const li = document.createElement('li');
      li.className = check.passed ? 'evidence-met' : 'evidence-missing';
      li.textContent = (check.passed ? '✓ ' : '→ ') + check.label + ' (' + check.points + ' pts)';
      ul.appendChild(li);
    });
    card.appendChild(ul);
  }
  return card;
}
function finishChallenge() {
  if (!reports.length) return;
  const cards = $('scenarioFeedback');
  cards.replaceChildren();
  let evidencePoints = 0;
  let docsTotal = 0;
  let documented = 0;
  let strongScenarios = 0;
  const scenarioPoints = [];
  scenarioSequence.forEach(scenario => {
    const matches = reports.filter(r => r.scenario === scenario);
    let best = null;
    let bestInfo = null;
    for (const r of matches) {
      const info = assessEvidence(r);
      if (!best || info.score > bestInfo.score ||
          (info.score === bestInfo.score && documentationPoints(r) > documentationPoints(best))) {
        best = r;
        bestInfo = info;
      }
    }
    if (best) {
      documented++;
      docsTotal += documentationPoints(best);
      evidencePoints += bestInfo.score;
      if (bestInfo.score >= 24) strongScenarios++;
    }
    scenarioPoints.push(bestInfo ? bestInfo.score : 0);
    cards.appendChild(scenarioFeedbackCard(scenario, best, bestInfo));
  });
  const documentationScore = Math.round(docsTotal / 3);
  const score = Math.min(REVIEW_MAX, evidencePoints + documentationScore);
  $('reviewScore').textContent = score + '/100';
  $('reviewProgress').value = score;
  $('reviewSummary').textContent = documented + '/3 scenarios documented · ' + strongScenarios + '/3 with strong evidence · ' + evidencePoints + '/90 evidence points · ' + documentationScore + '/10 documentation points.';
  $('reviewResults').hidden = false;
  $('answerGuide').hidden = false;
  $('reviewPrompt').textContent = 'Review ready. You can open the answer guide below. Edit reports and finish again to update this score.';
  const saveOutcome = saveReviewToProgress(score, scenarioPoints, documentationScore);
  $('reviewSaveStatus').textContent = saveOutcome.message;
  $('reviewResultsTitle').focus();
}

function init() {
  resetRuntime();
  loadReports();
  selectScenario();
  renderReports();
  $('finishChallenge').addEventListener('click', finishChallenge);
  $('scenarioSelect').addEventListener('change', selectScenario);
  $('sendPrimary').addEventListener('click', sendPrimary);
  $('verifyGet').addEventListener('click', verifyGet);
  $('resetSimulation').addEventListener('click', () => {
    if (!window.confirm('Reset simulated API users? Your saved bug reports will be kept.')) return;
    resetRuntime();
    selectScenario();
    $('responseAnnouncement').textContent = 'Simulated API reset. Saved reports were not changed.';
  });
  $('bugForm').addEventListener('submit', saveReport);
  $('cancelEdit').addEventListener('click', () => { cancelEdit(); $('formStatus').textContent = 'Editing cancelled.'; });
  $('clearReports').addEventListener('click', () => {
    if (!window.confirm('Delete every saved API bug report? This cannot be undone.')) return;
    reports = [];
    nextReportNumber = 1;
    cancelEdit();
    persistReports();
    renderReports();
    invalidateReview();
    $('formStatus').textContent = 'All saved reports deleted.';
  });
}

document.addEventListener('DOMContentLoaded', init);
