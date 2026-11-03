'use strict';
// Module 6: deterministic AI evaluation fixtures, no network calls or localStorage writes.
const CASES = [
  {
    "id": "EVAL-01",
    "weight": 15,
    "title": "A healthy, held-out evaluation set",
    "rule": "Acceptance gate: at least 95% accuracy on a held-out 200-case QA set, with no known overlap with model tuning or prompt-development examples.",
    "inputLabel": "Dataset provenance and evaluation snapshot",
    "input": "200 previously unused, reviewed support questions; 192 scored correct under a documented rubric.\nAll 200 IDs are disjoint from the tuning set; cases include standard questions and known boundary conditions.",
    "trace": "Correct: 192; incorrect: 8; total: 200.\nHeld-out set checked for duplicate IDs and near-duplicate prompts.\nNo blocker-class issue was observed in the supplied fixture.",
    "metricLabel": "Overall accuracy",
    "metricQuestion": "What percentage of the 200 held-out answers is correct?",
    "metric": 96,
    "finding": "pass",
    "decision": "approve",
    "severity": "none",
    "formula": "192 / 200 × 100 = 96%",
    "explanation": "The supplied set clears its defined accuracy gate (96% ≥ 95%), is held out, and has no observed critical blocker in this fixture. A single passing batch is not a substitute for production monitoring.",
    "retest": "Preserve the holdout, version prompts and rubric, rerun on model or retrieval changes, and monitor failures by intent."
  },
  {
    "id": "EVAL-02",
    "weight": 20,
    "title": "Groundedness falls after a model update",
    "rule": "Release gate: answer groundedness must be at least 90% and may not decline more than 3 percentage points from the approved baseline on the same 100-case evaluation set.",
    "inputLabel": "Version comparison",
    "input": "Approved baseline: 94 of 100 answers grounded in the cited policy.\nCandidate build: 86 of the same 100 answers grounded.\nEvaluator rubric and dataset version are unchanged.",
    "trace": "Baseline groundedness = 94%. Candidate groundedness = 86%.\nObserved change = −8 percentage points; 14 candidate answers are unsupported.",
    "metricLabel": "Candidate groundedness",
    "metricQuestion": "What percentage of candidate answers are grounded?",
    "metric": 86,
    "finding": "groundedness-regression",
    "decision": "block",
    "severity": "high",
    "formula": "86 / 100 × 100 = 86%; change from baseline = −8 percentage points",
    "explanation": "Candidate groundedness breaks both gates: 86% is below 90%, and an 8-point regression exceeds the maximum 3-point drop. This is a release-blocking evaluation failure under the fictional policy.",
    "retest": "Cluster unsupported answers by policy, retrieval trace and prompt type; fix the failures and rerun the unchanged benchmark plus fresh holdout cases."
  },
  {
    "id": "EVAL-03",
    "weight": 20,
    "title": "High accuracy hides missed unsafe outputs",
    "rule": "Safety classifier launch gate: recall on truly unsafe outputs must be at least 95%. Unsafe is the positive class. Overall accuracy cannot substitute for recall.",
    "inputLabel": "Confusion matrix (400 evaluated outputs)",
    "input": "True positives (unsafe correctly flagged): 72\nFalse negatives (unsafe missed): 8\nFalse positives (safe incorrectly flagged): 18\nTrue negatives (safe correctly allowed): 302",
    "trace": "Overall accuracy = (72 + 302) / 400 = 93.5%.\nThe evaluation team has not accepted missed unsafe responses as harmless.\nFalse negatives directly affect the critical safety gate.",
    "metricLabel": "Unsafe-class recall",
    "metricQuestion": "What percentage of truly unsafe outputs were flagged?",
    "metric": 90,
    "finding": "safety-recall-gate",
    "decision": "block",
    "severity": "high",
    "formula": "Recall = TP / (TP + FN) × 100 = 72 / (72 + 8) × 100 = 90%; precision = 72 / (72 + 18) = 80%",
    "explanation": "The true-positive recall is 90%, below the required 95%. The relatively high 93.5% overall accuracy masks eight missed unsafe outputs. Class-specific metrics and error costs determine the release decision.",
    "retest": "Audit the eight false negatives, segment by risk category, improve safeguards and re-evaluate recall, precision and false-positive rate on a held-out safety set."
  },
  {
    "id": "EVAL-04",
    "weight": 15,
    "title": "One language fails a release-quality gate",
    "rule": "On the same 100 matched intents per language: each language must score at least 85% answer accuracy, and the gap between languages must not exceed 10 percentage points.",
    "inputLabel": "Matched language evaluation",
    "input": "English: 94 correct / 100 evaluated.\nKiswahili: 79 correct / 100 evaluated.\nItems were paired by intent and difficulty, with the same policy version and independent human review.",
    "trace": "English observed accuracy: 94%.\nKiswahili observed accuracy: 79%.\nObserved gap: 15 percentage points; the cause of the difference has not been identified.",
    "metricLabel": "Kiswahili accuracy",
    "metricQuestion": "What percentage of Kiswahili answers were correct?",
    "metric": 79,
    "finding": "subgroup-quality-gate",
    "decision": "block",
    "severity": "high",
    "formula": "79 / 100 × 100 = 79%; 94% − 79% = 15 percentage-point gap",
    "explanation": "Kiswahili quality is below the 85% per-language gate and the observed 15-point gap exceeds the 10-point limit. This is an observed release-quality problem, not proof of its cause or population-wide discriminatory impact.",
    "retest": "Review incorrect Kiswahili answers with qualified reviewers, check policy retrieval and translation, add more matched prompts, and report uncertainty and per-intent error rates."
  },
  {
    "id": "EVAL-05",
    "weight": 15,
    "title": "Human reviewers disagree about pass/fail labels",
    "rule": "Evaluation labels are admissible only after a rubric audit: minimum observed agreement 80% and Cohen’s kappa at least 0.70. Disagreements must be resolved before using the score as a release gate.",
    "inputLabel": "Two-reviewer QA audit",
    "input": "40 double-rated answers.\nReviewers agreed on 30 and disagreed on 10.\nObserved agreement: 30/40.\nBased on balanced reviewer marginals, chance-expected agreement is 50%.",
    "trace": "A rubric discrepancy affects whether qualified partial answers count as correct.\nNeither annotator is yet designated the adjudicated gold label.\nKappa is calculable from 75% observed and 50% expected agreement.",
    "metricLabel": "Observed reviewer agreement",
    "metricQuestion": "What percentage of labels did the reviewers agree on?",
    "metric": 75,
    "finding": "reviewer-agreement",
    "decision": "investigate",
    "severity": "medium",
    "formula": "Observed agreement = 30 / 40 × 100 = 75%; κ = (0.75 − 0.50) / (1 − 0.50) = 0.50",
    "explanation": "Agreement is 75%, below 80%; Cohen’s kappa is 0.50, below 0.70. The scoring instrument needs clarification/adjudication. Do not treat uncertain labels as a reliable launch verdict.",
    "retest": "Refine the rubric with concrete examples, adjudicate 10 disagreements, rerun blinded double-rating, and track agreement by category."
  },
  {
    "id": "EVAL-06",
    "weight": 15,
    "title": "Critical privacy failures override a high pass rate",
    "rule": "Launch gate: zero critical private-data disclosures, regardless of aggregate evaluation score. Every confirmed critical breach must be remediated and retested.",
    "inputLabel": "Fictional red-team regression",
    "input": "200 privacy and authorization cases.\n198 pass; 2 fail with verified cross-account order-detail disclosures.\nThe release dashboard highlights 99% aggregate pass rate.",
    "trace": "2 of 200 tests contain confirmed critical disclosure.\nCritical-failure budget is exactly zero; there is no percentage tolerance for the blocker condition.",
    "metricLabel": "Critical failure rate",
    "metricQuestion": "What percentage of all cases exposed private data?",
    "metric": 1,
    "finding": "critical-safety-gate",
    "decision": "block",
    "severity": "critical",
    "formula": "2 / 200 × 100 = 1% critical failure rate; required critical failures = 0",
    "explanation": "Even though 99% of cases pass, the observed 1% critical disclosure rate violates the zero-critical-failures requirement. A high average score must never override an explicit blocker gate.",
    "retest": "Reproduce both cross-account leaks, validate authorization at the data/tool boundary, add regression cases for the exploit variants, then rerun the complete security set."
  }
];
const FINDINGS = [
  ['pass', 'Pass — evaluation meets stated gates'],
  ['groundedness-regression', 'Regression — answer grounding declined'],
  ['safety-recall-gate', 'Unsafe-class recall below threshold'],
  ['subgroup-quality-gate', 'Subgroup quality gate breached'],
  ['reviewer-agreement', 'Annotation / rubric reliability issue'],
  ['critical-safety-gate', 'Critical privacy blocker despite high aggregate score']
];
const DECISIONS = [
  ['approve', 'Approve — case passes stated gate'],
  ['block', 'Block release — acceptance gate failed'],
  ['investigate', 'Investigate / adjudicate before release verdict']
];
const SEVERITIES = [
  ['none', 'None — no defect'], ['low', 'Low'], ['medium', 'Medium'],
  ['high', 'High'], ['critical', 'Critical']
];
const $ = id => document.getElementById(id);
const state = { reviewed: false, answers: null, score: null };
function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function selectField(item, key, title, choices) {
  const wrapper = make('div', 'field');
  const id = `${item.id}-${key}`;
  const label = make('label', '', title);
  label.htmlFor = id;
  const select = make('select');
  select.id = id;
  select.name = id;
  select.required = true;
  const placeholder = make('option', '', 'Choose an option…');
  placeholder.value = '';
  select.append(placeholder);
  for (const [value, caption] of choices) {
    const option = make('option', '', caption);
    option.value = value;
    select.append(option);
  }
  wrapper.append(label, select);
  return wrapper;
}
function metricField(item) {
  const wrapper = make('div', 'field');
  const label = make('label', '', `${item.metricLabel} (%)`);
  const id = `${item.id}-metric`;
  label.htmlFor = id;
  const input = make('input');
  input.id = id;
  input.name = id;
  input.type = 'number';
  input.min = '0';
  input.max = '100';
  input.step = '0.01';
  input.inputMode = 'decimal';
  input.placeholder = '0–100';
  input.required = true;
  const hint = make('p', 'metric-help', item.metricQuestion + ' Enter a number without the % symbol.');
  wrapper.append(label, input, hint);
  return wrapper;
}
function textareaField(item, key, title, placeholder) {
  const wrapper = make('div', 'field field-wide');
  const label = make('label', '', title);
  const textarea = make('textarea');
  textarea.id = `${item.id}-${key}`;
  textarea.name = textarea.id;
  textarea.rows = 3;
  textarea.maxLength = 1200;
  textarea.placeholder = placeholder;
  label.htmlFor = textarea.id;
  wrapper.append(label, textarea);
  return wrapper;
}
function evidencePanel(className, title, text) {
  const section = make('div', `security-panel ${className}`);
  section.append(make('h4', '', title), make('p', '', text));
  return section;
}
function renderCases() {
  const target = $('caseList');
  for (const [index, item] of CASES.entries()) {
    const card = make('article', 'case');
    card.dataset.caseId = item.id;
    const headingId = `${item.id}-title`;
    card.setAttribute('aria-labelledby', headingId);
    const top = make('div', 'case-top');
    const group = make('div');
    group.append(make('span', 'case-index', `CASE ${index + 1} · ${item.id}`));
    const title = make('h3', '', item.title);
    title.id = headingId;
    group.append(title);
    top.append(group, make('span', 'points', `${item.weight} points`));
    const evidence = make('div', 'security-panels');
    evidence.append(
      evidencePanel('rule', 'Approved requirement / release gate', item.rule),
      evidencePanel('input', item.inputLabel, item.input)
    );
    const trace = make('div', 'trace-panel');
    trace.append(
      make('h4', '', 'Observed evaluation results / QA evidence'),
      make('p', '', item.trace),
      make('p', 'trace-note', 'All dataset counts are fictional; apply the specified case gate.')
    );
    const picks = make('div', 'answer-grid metric-answers');
    picks.append(
      selectField(item, 'finding', 'Primary evaluation finding', FINDINGS),
      selectField(item, 'decision', 'Recommended release action', DECISIONS),
      selectField(item, 'severity', 'Impact / severity', SEVERITIES),
      metricField(item)
    );
    card.append(
      top, evidence, trace, picks,
      textareaField(item, 'notes', 'Calculation and evidence notes (not automatically scored)', 'Explain denominators, risk, sample limitations and which gate is involved.'),
      textareaField(item, 'retest', 'Follow-up evaluation plan (not automatically scored)', 'Describe the cases, metric threshold, regression comparison and responsible retest.')
    );
    target.append(card);
  }
}
function currentAnswers() {
  return CASES.map(item => ({
    item,
    finding: $(`${item.id}-finding`).value,
    decision: $(`${item.id}-decision`).value,
    severity: $(`${item.id}-severity`).value,
    metricRaw: $(`${item.id}-metric`).value.trim(),
    notes: $(`${item.id}-notes`).value.trim(),
    retest: $(`${item.id}-retest`).value.trim()
  }));
}
function validMetric(raw) {
  if (!raw) return false;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}
function answerComplete(a) {
  return Boolean(a.finding && a.decision && a.severity && validMetric(a.metricRaw));
}
function updateCount() {
  $('completedCount').textContent = `${currentAnswers().filter(answerComplete).length}/${CASES.length}`;
}
function invalidateReview() {
  if (!state.reviewed) return;
  state.reviewed = false;
  state.answers = null;
  state.score = null;
  $('results').hidden = true;
  $('downloadStatus').textContent = '';
  $('formStatus').textContent = 'Answers changed. Review again before downloading updated findings.';
}
function points(item, answer) {
  const finding = Math.round(item.weight * 0.45);
  const decision = Math.round(item.weight * 0.20);
  const severity = Math.round(item.weight * 0.15);
  const metric = item.weight - finding - decision - severity;
  return {
    finding: answer.finding === item.finding ? finding : 0,
    decision: answer.decision === item.decision ? decision : 0,
    severity: answer.severity === item.severity ? severity : 0,
    metric: Math.abs(Number(answer.metricRaw) - item.metric) < 0.051 ? metric : 0
  };
}
function caption(choices, value) {
  const match = choices.find(option => option[0] === value);
  return match ? match[1] : 'Not selected';
}
function review(event) {
  event.preventDefault();
  const answers = currentAnswers();
  const missing = answers.find(a => !answerComplete(a));
  if (missing) {
    const key = ['finding', 'decision', 'severity', 'metric'].find(field =>
      field === 'metric' ? !validMetric(missing.metricRaw) : !missing[field]);
    $('formStatus').textContent = `Complete a valid ${key === 'metric' ? 'percentage (0–100)' : key} for ${missing.item.id} before reviewing.`;
    $(`${missing.item.id}-${key}`).focus();
    return;
  }
  let total = 0;
  const target = $('feedbackList');
  target.replaceChildren();
  for (const a of answers) {
    const item = a.item;
    const earned = points(item, a);
    const subtotal = Object.values(earned).reduce((sum, val) => sum + val, 0);
    total += subtotal;
    const box = make('article', 'feedback');
    box.append(make('h3', '', `${item.id} · ${item.title}`));
    box.append(make('span', `mark${subtotal === item.weight ? ' full' : ''}`, `${subtotal}/${item.weight} points`));
    box.append(make('p', 'reference', `Reference finding: ${caption(FINDINGS, item.finding)}`));
    box.append(make('p', 'reference', `Release action: ${caption(DECISIONS, item.decision)} · Severity: ${caption(SEVERITIES, item.severity)}`));
    box.append(make('p', 'metric-reference', `Reference metric: ${item.metric}% · ${item.formula}`));
    box.append(make('p', 'score-breakdown', `Your scoring: finding ${earned.finding} + decision ${earned.decision} + severity ${earned.severity} + metric ${earned.metric}`));
    box.append(make('p', '', item.explanation));
    box.append(make('p', 'tip', `Suggested retest: ${item.retest}`));
    target.append(box);
  }
  state.reviewed = true;
  state.answers = answers;
  state.score = total;
  $('resultScore').textContent = `${total}/100`;
  $('resultIntro').textContent = `You evaluated ${CASES.length} fictional AI release-quality scenarios. Check the calculated metrics and specified gates before shipping.`;
  $('results').hidden = false;
  $('formStatus').textContent = 'Review complete. Download your findings or revise the assessment.';
  $('results').focus({ preventScroll: true });
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function reportText() {
  const lines = [
    'PRACTICAL QA LAB — AI TESTING MODULE 6',
    'EVALUATION DATASETS, REGRESSION TESTING & QUALITY METRICS — GUIDED PRACTICE',
    'Fictional dataset snapshots, fixed release criteria and learner-written QA notes.',
    'Not a live model evaluation, production assurance report or actual certification.',
    `Generated: ${new Date().toISOString()}`,
    `Assessment score: ${state.score}/100`,
    'Written evidence and retest plans are learner-authored and not automatically scored.',
    ''
  ];
  for (const a of state.answers) {
    const item = a.item;
    lines.push(
      `${item.id} — ${item.title}`,
      `Approved requirement: ${item.rule}`,
      `${item.inputLabel}: ${item.input}`,
      `Observed QA evidence: ${item.trace}`,
      `Requested metric: ${item.metricLabel}`,
      `Learner metric: ${a.metricRaw}%`,
      `Learner finding: ${caption(FINDINGS, a.finding)}`,
      `Learner release action: ${caption(DECISIONS, a.decision)}`,
      `Learner severity: ${caption(SEVERITIES, a.severity)}`,
      `Calculation and evidence notes: ${a.notes || '(not supplied)'}`,
      `Follow-up evaluation plan: ${a.retest || '(not supplied)'}`,
      `Reference finding: ${caption(FINDINGS, item.finding)}`,
      `Reference action: ${caption(DECISIONS, item.decision)}`,
      `Reference severity: ${caption(SEVERITIES, item.severity)}`,
      `Reference metric: ${item.metric}% (${item.formula})`,
      `Reference explanation: ${item.explanation}`,
      `Suggested retest: ${item.retest}`,
      '------------------------------------------------------------', ''
    );
  }
  return lines.join('\n') + '\n';
}
function downloadReport() {
  if (!state.reviewed || !state.answers) {
    $('downloadStatus').textContent = 'Review the assessment before downloading.';
    return;
  }
  let objectUrl;
  try {
    const blob = new Blob([reportText()], { type: 'text/plain;charset=utf-8' });
    objectUrl = URL.createObjectURL(blob);
    const link = make('a');
    link.href = objectUrl;
    link.download = 'ai-testing-module6-metrics-findings.txt';
    document.body.append(link);
    try { link.click(); } finally { link.remove(); }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    $('downloadStatus').textContent = 'Practice findings download prepared.';
  } catch (_) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    $('downloadStatus').textContent = 'Download unavailable. Your answers remain in this tab.';
  }
}
function reset() {
  $('assessmentForm').reset();
  invalidateReview();
  updateCount();
  $('formStatus').textContent = 'Selections cleared. Start a new evaluation.';
  $('EVAL-01-finding').focus();
}
function setup() {
  renderCases();
  $('assessmentForm').addEventListener('submit', review);
  $('assessmentForm').addEventListener('input', () => { updateCount(); invalidateReview(); });
  $('assessmentForm').addEventListener('change', () => { updateCount(); invalidateReview(); });
  $('resetButton').addEventListener('click', reset);
  $('downloadButton').addEventListener('click', downloadReport);
  $('reviseButton').addEventListener('click', () => {
    $('EVAL-01-finding').focus();
    $('EVAL-01-finding').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  updateCount();
}
setup();
