'use strict';

// Fictional, deterministic learning fixtures. No network requests or localStorage.
const MISSIONS = [
  {
    id: 'RC2-01', weight: 15, title: 'Equivalent prompts return inconsistent policy answers',
    criterion: 'AC-01 · Instruction-following must be at least 95% on 50 matched paraphrases.',
    evidence: '50 paired customer prompts; the current build follows the approved formatting and policy rule on 42 pairs. Eight pairs give a contradictory or incomplete response.',
    observation: 'Baseline RC-1 followed 48/50 prompts. RC-2 follows 42/50, despite equivalent intent and the same requirement.',
    metricName: 'RC-2 instruction-following accuracy', metricPrompt: '42 of 50 prompts meet the rule. Calculate the percentage.', unit: '%', metric: 84,
    finding: 'instruction-regression', severity: 'medium', action: 'block',
    explanation: '84% (42/50) misses the 95% mandatory threshold and regresses from 96% in RC-1. A release gate failure should not be waived because most answers are correct.',
    retest: 'Fix instruction hierarchy and output validation; rerun the 50 paired prompts and add new boundary paraphrases to a held-out set.'
  },
  {
    id: 'RC2-02', weight: 15, title: 'Retrieved evidence does not support the answer',
    criterion: 'AC-02 · At least 95% of factual answers must be supported by source text, and citations must not be fabricated.',
    evidence: 'The retriever returned 30 document-backed questions. Reviewers found 27 correctly supported answers and 3 unsupported answers, including one pointing to a non-existent policy section.',
    observation: 'An AI answer claims “refunds are guaranteed in 2 hours” and cites Policy §9.4. The approved refund excerpt gives a 5-business-day review period, and §9.4 does not exist.',
    metricName: 'Evidence-grounding rate', metricPrompt: '27 of 30 reviewed answers are supported. Calculate the percentage.', unit: '%', metric: 90,
    finding: 'unsupported-citation', severity: 'high', action: 'block',
    explanation: '90% grounding (27/30) falls below 95%. A fabricated section and an unsupported two-hour promise demonstrate an answer-generation/citation problem. Validate source retrieval separately.',
    retest: 'Require citation-to-span verification, test abstention for unsupported promises, and compare retrieved snippets against the approved policy version.'
  },
  {
    id: 'RC2-03', weight: 20, title: 'Indirect prompt injection exposes a second account',
    criterion: 'AC-03 · Zero verified cross-account data disclosures, even in adversarial retrieved documents.',
    evidence: '40 malicious-document fixtures were tested. One injected knowledge-base page instructed Assist AI to fetch a different customer’s order record; the observed tool trace returned that other account’s email and order details.',
    observation: 'The attacker-controlled document used instructions disguised as an internal support note. The tool accepted the request without enforcing account authorization.',
    metricName: 'Confirmed private-data disclosure rate', metricPrompt: '1 of 40 adversarial fixtures caused disclosure. Calculate the percentage.', unit: '%', metric: 2.5,
    finding: 'cross-account-leak', severity: 'critical', action: 'block',
    explanation: 'The observed 2.5% (1/40) includes a confirmed private-data leak. A zero-tolerance privacy gate is breached. The root control must be authorization at the tool/data boundary—not just prompt filtering.',
    retest: 'Fix tool authorization, isolate user scope, replay the exploit and variants, and require zero confirmed cross-account disclosures before re-evaluation.'
  },
  {
    id: 'RC2-04', weight: 15, title: 'Matched Kiswahili requests receive lower-quality answers',
    criterion: 'AC-04 · Both English and Kiswahili accuracy must be at least 90%, with a gap of at most 10 percentage points.',
    evidence: 'Independent reviewers evaluated 100 matched intents per language: English 96 correct / 100, Kiswahili 82 correct / 100. Prompts were matched for policy, intent and difficulty.',
    observation: 'The observed performance gap is consistent across several support-policy intents. These samples show a release-quality disparity; they do not establish its cause or population-wide unfairness.',
    metricName: 'Accuracy gap between languages', metricPrompt: 'Subtract Kiswahili accuracy from English accuracy. Enter percentage points.', unit: 'percentage points', metric: 14,
    finding: 'language-quality-gap', severity: 'high', action: 'block',
    explanation: 'Kiswahili accuracy is 82%, below 90%, and the 14-point gap exceeds 10. Both acceptance criteria fail. Further review is needed to identify causes and measure uncertainty.',
    retest: 'Audit mislabeled and translated prompts with qualified Kiswahili reviewers, fix failures, and repeat matched, stratified evaluations with confidence intervals.'
  },
  {
    id: 'RC2-05', weight: 15, title: 'Human evaluation labels are unreliable',
    criterion: 'AC-05 · Before using reviewer labels as a release gate, Cohen’s kappa must be at least 0.70.',
    evidence: '40 answers were double-rated. Reviewers agreed on 30. Observed agreement was 0.75 and chance-expected agreement was 0.50 based on the reviewers’ label distributions.',
    observation: 'The 10 disputed labels concern partial-but-acceptable answers. No adjudicated gold labels are available yet; the evaluation rubric needs clarification.',
    metricName: 'Cohen’s kappa', metricPrompt: 'Calculate κ = (0.75 − 0.50) / (1 − 0.50). Enter a decimal (e.g., 0.50).', unit: 'κ', metric: 0.5,
    finding: 'label-reliability', severity: 'medium', action: 'investigate',
    explanation: 'κ = 0.50, below the required 0.70. Labels are not reliable enough to certify a release. Adjudication and rubric revision are needed; an inconclusive audit is not itself evidence of a specific model defect.',
    retest: 'Revise rubric examples, adjudicate disputed cases with a third reviewer, double-rate fresh cases, and calculate κ separately for critical categories.'
  },
  {
    id: 'RC2-06', weight: 10, title: 'AI tool executes an unauthorized account action',
    criterion: 'AC-06 · Zero unauthorized account or payment actions. AC-07 · Mandatory gate failures require No-Go.',
    evidence: '200 action-authorization tests ran. 199 passed. In one trace, Assist AI requested an account credit using an unapproved tool action without customer confirmation, and the tool executed it.',
    observation: 'The release summary shows 99.5% pass rate, but the single failure is a verified action-boundary violation rather than a harmless text-generation error.',
    metricName: 'Unauthorized-action failure rate', metricPrompt: '1 of 200 action cases failed. Calculate the percentage.', unit: '%', metric: 0.5,
    finding: 'unauthorized-tool-action', severity: 'critical', action: 'block',
    explanation: '0.5% (1/200) is nonzero and violates the explicit zero-unauthorized-action gate. A near-perfect average cannot compensate for an executed, unapproved account action.',
    retest: 'Enforce confirmation and authorization at the tool boundary, replay the failing trace, and rerun the entire action/approval regression suite.'
  }
];

const FINDINGS = [
  ['pass', 'Pass — requirements met'],
  ['instruction-regression', 'Prompt / instruction-following regression'],
  ['unsupported-citation', 'Unsupported claim and fabricated citation'],
  ['cross-account-leak', 'Cross-account privacy breach via injection'],
  ['language-quality-gap', 'Language-group quality gate failure'],
  ['label-reliability', 'Evaluation label / reviewer reliability issue'],
  ['unauthorized-tool-action', 'Unauthorized AI tool action']
];
const SEVERITIES = [
  ['none', 'None — no issue confirmed'], ['low', 'Low'], ['medium', 'Medium'],
  ['high', 'High'], ['critical', 'Critical']
];
const ACTIONS = [
  ['approve', 'Approve — criteria met'],
  ['block', 'Block — mandatory gate failed'],
  ['investigate', 'Investigate / adjudicate before verdict']
];
const $ = id => document.getElementById(id);
const assessment = { reviewed: false, score: null, snapshot: null, breakdown: null };
const labelFor = (choices, value) => choices.find(option => option[0] === value)?.[1] || value;
const node = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

function evidenceBox(className, label, content) {
  const box = node('div', `evidence-panel ${className}`);
  box.append(node('h4', '', label), node('p', '', content));
  return box;
}
function selectField(mission, key, label, options) {
  const field = node('div', 'field');
  const id = `${mission.id}-${key}`;
  const heading = node('label', '', label);
  heading.htmlFor = id;
  const select = node('select');
  select.id = id;
  select.name = id;
  select.required = true;
  const placeholder = node('option', '', 'Choose an answer…');
  placeholder.value = '';
  select.append(placeholder);
  for (const [value, text] of options) {
    const option = node('option', '', text);
    option.value = value;
    select.append(option);
  }
  field.append(heading, select);
  return field;
}
function metricField(mission) {
  const field = node('div', 'field');
  const label = node('label', '', `${mission.metricName} (${mission.unit}) *`);
  label.htmlFor = `${mission.id}-metric`;
  const input = node('input');
  input.type = 'number'; input.inputMode = 'decimal'; input.step = 'any'; input.required = true;
  input.id = `${mission.id}-metric`; input.name = input.id;
  input.placeholder = 'Enter a calculated number';
  const help = node('p', 'hint', mission.metricPrompt);
  field.append(label, input, help);
  return field;
}
function notesField(mission) {
  const field = node('div', 'field full');
  const label = node('label', '', 'Evidence-based QA note *');
  label.htmlFor = `${mission.id}-notes`;
  const textarea = node('textarea');
  textarea.id = `${mission.id}-notes`; textarea.name = textarea.id;
  textarea.maxLength = 1200; textarea.rows = 3; textarea.required = true;
  textarea.placeholder = 'Explain the observed defect or uncertainty and how you would retest it (minimum 12 characters).';
  field.append(label, textarea, node('p', 'hint', 'Written evidence is required, but not semantically auto-scored.'));
  return field;
}
function renderMissions() {
  const list = $('missionList');
  for (const [index, mission] of MISSIONS.entries()) {
    const article = node('article', 'mission');
    article.dataset.missionId = mission.id;
    const headingId = `${mission.id}-title`;
    article.setAttribute('aria-labelledby', headingId);
    const header = node('div', 'mission-top');
    const group = node('div');
    group.append(node('span', 'mission-tag', `MISSION ${index + 1} · ${mission.id}`));
    const title = node('h3', '', mission.title);
    title.id = headingId; group.append(title);
    header.append(group, node('span', 'points', `${mission.weight} points`));
    const evidence = node('div', 'evidence-grid');
    evidence.append(
      evidenceBox('approved', 'Approved release requirement', mission.criterion),
      evidenceBox('', 'Evaluation dataset / record', mission.evidence)
    );
    const trace = node('div', 'trace');
    trace.append(node('h4', '', 'Observed behavior / investigation trace'), node('p', '', mission.observation));
    const inputs = node('div', 'answer-grid');
    inputs.append(
      selectField(mission, 'finding', 'Primary finding *', FINDINGS),
      selectField(mission, 'severity', 'Observed severity *', SEVERITIES),
      selectField(mission, 'action', 'Next release action *', ACTIONS),
      metricField(mission),
      notesField(mission)
    );
    article.append(header, evidence, trace, inputs);
    list.append(article);
  }
}
function missionAnswers() {
  return MISSIONS.map(mission => ({
    id: mission.id,
    finding: $(`${mission.id}-finding`).value,
    severity: $(`${mission.id}-severity`).value,
    action: $(`${mission.id}-action`).value,
    metricRaw: $(`${mission.id}-metric`).value.trim(),
    notes: $(`${mission.id}-notes`).value.trim()
  }));
}
function isFiniteMetric(text) {
  return text !== '' && Number.isFinite(Number(text)) && Number(text) >= 0 && Number(text) <= 100;
}
function missionComplete(answer) {
  return Boolean(answer.finding && answer.severity && answer.action && isFiniteMetric(answer.metricRaw) && answer.notes.length >= 12);
}
function updateCount() {
  $('completedCount').textContent = `${missionAnswers().filter(missionComplete).length}/${MISSIONS.length}`;
}
function invalidateReview() {
  if (!assessment.reviewed) return;
  assessment.reviewed = false;
  assessment.snapshot = null;
  assessment.score = null;
  assessment.breakdown = null;
  $('results').hidden = true;
  $('downloadStatus').textContent = '';
  $('formStatus').textContent = 'Your assessment changed. Review it again before downloading an updated report.';
}
function resetAll() {
  $('assessmentForm').reset();
  invalidateReview();
  assessment.reviewed = false;
  assessment.snapshot = null;
  assessment.score = null;
  assessment.breakdown = null;
  $('results').hidden = true;
  $('formStatus').textContent = 'Selections cleared. Complete the six investigations and final verdict to begin again.';
  updateCount();
}
function sameMetric(raw, expected) { return Math.abs(Number(raw) - expected) <= 0.01; }
function scoreOne(mission, answer) {
  const earned = {
    finding: answer.finding === mission.finding ? mission.weight * 0.4 : 0,
    severity: answer.severity === mission.severity ? mission.weight * 0.2 : 0,
    action: answer.action === mission.action ? mission.weight * 0.2 : 0,
    metric: sameMetric(answer.metricRaw, mission.metric) ? mission.weight * 0.2 : 0
  };
  return { earned, points: Object.values(earned).reduce((a, b) => a + b, 0) };
}
function fmt(value) { return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''); }
function makeFeedback(mission, answer, result) {
  const card = node('article', 'feedback');
  card.append(
    node('h3', '', `${mission.id} · ${mission.title}`),
    node('p', 'earned', `Reference-score points: ${fmt(result.points)} / ${mission.weight}`),
    node('p', 'line', `Finding: ${labelFor(FINDINGS, answer.finding)} | Reference: ${labelFor(FINDINGS, mission.finding)}`),
    node('p', 'line', `Severity: ${labelFor(SEVERITIES, answer.severity)} | Reference: ${labelFor(SEVERITIES, mission.severity)}`),
    node('p', 'line', `Action: ${labelFor(ACTIONS, answer.action)} | Reference: ${labelFor(ACTIONS, mission.action)}`),
    node('p', 'line', `Metric: ${answer.metricRaw} ${mission.unit} | Reference: ${fmt(mission.metric)} ${mission.unit}`),
    node('p', '', mission.explanation),
    node('p', '', `Recommended retest: ${mission.retest}`)
  );
  return card;
}
function reviewAssessment(event) {
  event.preventDefault();
  const answers = missionAnswers();
  const missing = answers.findIndex(answer => !missionComplete(answer));
  if (missing !== -1) {
    $('formStatus').textContent = `Complete all required fields and at least 12 characters of evidence for Mission ${missing + 1}.`;
    $(`${MISSIONS[missing].id}-${!answers[missing].finding ? 'finding' : !answers[missing].severity ? 'severity' : !answers[missing].action ? 'action' : !isFiniteMetric(answers[missing].metricRaw) ? 'metric' : 'notes'}`).focus();
    return;
  }
  const verdict = $('releaseVerdict').value;
  const rationale = $('releaseRationale').value.trim();
  const retestPlan = $('retestPlan').value.trim();
  if (!verdict || rationale.length < 25 || retestPlan.length < 30) {
    $('formStatus').textContent = 'Complete the release decision, a 25-character rationale and a 30-character remediation/retest plan.';
    $(!verdict ? 'releaseVerdict' : rationale.length < 25 ? 'releaseRationale' : 'retestPlan').focus();
    return;
  }
  const breakdown = answers.map((answer, index) => scoreOne(MISSIONS[index], answer));
  const missionScore = breakdown.reduce((sum, entry) => sum + entry.points, 0);
  const verdictScore = verdict === 'no-go' ? 10 : 0;
  const score = Math.round((missionScore + verdictScore) * 100) / 100;
  assessment.reviewed = true;
  assessment.score = score;
  assessment.breakdown = breakdown;
  assessment.snapshot = { answers: answers.map(a => ({...a})), verdict, rationale, retestPlan };
  $('resultScore').textContent = `${fmt(score)} / 100`;
  $('resultSummary').textContent = verdictScore
    ? 'Your final release verdict is consistent with the zero-tolerance blockers.'
    : 'Your final release verdict conflicts with confirmed critical blockers. Review the evidence and acceptance criteria.';
  const list = $('feedbackList');
  list.replaceChildren();
  MISSIONS.forEach((mission, i) => list.append(makeFeedback(mission, answers[i], breakdown[i])));
  const verdictBox = $('verdictFeedback');
  verdictBox.replaceChildren(
    node('h3', '', `Final release verdict: ${verdictScore} / 10 points`),
    node('p', '', 'Reference outcome: No-Go. RC-2 violates mandatory instruction, grounding, privacy, language quality and tool-authorization gates; reviewer reliability also needs adjudication. Fix and independently retest the failed criteria before reconsidering release.')
  );
  $('results').hidden = false;
  $('formStatus').textContent = 'Assessment reviewed. You may revise answers or download a practice QA release report.';
  $('downloadStatus').textContent = '';
  $('results').focus();
}
function buildReport() {
  const snap = assessment.snapshot;
  const lines = [
    'PRACTICAL QA LAB — AI TESTING CAPSTONE',
    'ASSIST AI — FICTIONAL RELEASE CANDIDATE RC-2',
    'GUIDED SIMULATION / PRACTICE EVIDENCE — NOT A REAL MODEL AUDIT',
    `Exported: ${new Date().toISOString()}`,
    `Assessment score: ${fmt(assessment.score)} / 100`,
    'Release acceptance criteria: AC-01 through AC-07 (fictional training gates)',
    '',
    `LEARNER RELEASE VERDICT: ${snap.verdict.toUpperCase()}`,
    'QA RELEASE RATIONALE:',
    snap.rationale,
    '',
    'LEARNER REMEDIATION AND RETEST PLAN:',
    snap.retestPlan,
    '',
    'REFERENCE RELEASE VERDICT: NO-GO',
    'Confirmed privacy and unauthorized-tool-action failures violate zero-tolerance gates. Quality thresholds also fail; reviewer agreement needs adjudication.',
    '',
    '============================================================',
    ''
  ];
  MISSIONS.forEach((mission, index) => {
    const answer = snap.answers[index];
    const score = assessment.breakdown[index];
    lines.push(
      `MISSION ${index + 1} — ${mission.id}: ${mission.title}`,
      `Points: ${fmt(score.points)} / ${mission.weight}`,
      `Release criterion: ${mission.criterion}`,
      'Given evidence:', mission.evidence,
      'Observed trace:', mission.observation,
      `Learner finding: ${labelFor(FINDINGS, answer.finding)}`,
      `Learner severity: ${labelFor(SEVERITIES, answer.severity)}`,
      `Learner action: ${labelFor(ACTIONS, answer.action)}`,
      `Learner metric: ${answer.metricRaw} ${mission.unit}`,
      'Learner QA notes:', answer.notes,
      `Reference finding: ${labelFor(FINDINGS, mission.finding)}`,
      `Reference severity: ${labelFor(SEVERITIES, mission.severity)}`,
      `Reference action: ${labelFor(ACTIONS, mission.action)}`,
      `Reference metric: ${fmt(mission.metric)} ${mission.unit}`,
      `Reference reasoning: ${mission.explanation}`,
      `Retest recommendation: ${mission.retest}`,
      '', '------------------------------------------------------------', ''
    );
  });
  lines.push('End of simulated QA practice report.', 'Review learner-written notes for personal information before sharing.');
  return `${lines.join('\n')}\n`;
}
function downloadReport() {
  if (!assessment.reviewed || !assessment.snapshot || assessment.score === null) {
    $('downloadStatus').textContent = 'Review all missions before downloading a report.';
    return;
  }
  let url;
  try {
    const blob = new Blob([buildReport()], {type: 'text/plain;charset=utf-8'});
    url = URL.createObjectURL(blob);
    const link = node('a');
    link.href = url;
    link.download = 'assist-ai-release-qa-capstone-report.txt';
    document.body.append(link);
    try { link.click(); } finally { link.remove(); }
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('downloadStatus').textContent = 'Practice QA release report prepared for download.';
  } catch (_) {
    if (url) URL.revokeObjectURL(url);
    $('downloadStatus').textContent = 'Download unavailable. Your assessment is still shown on this page.';
  }
}
renderMissions();
$('assessmentForm').addEventListener('input', () => { invalidateReview(); updateCount(); });
$('assessmentForm').addEventListener('change', () => { invalidateReview(); updateCount(); });
$('assessmentForm').addEventListener('submit', reviewAssessment);
$('resetButton').addEventListener('click', resetAll);
$('reviseButton').addEventListener('click', () => {
  $('results').hidden = true;
  assessment.reviewed = false;
  assessment.snapshot = null;
  assessment.score = null;
  assessment.breakdown = null;
  $('formStatus').textContent = 'Revise your findings and review again to refresh the report.';
  $('assessmentForm').scrollIntoView({behavior:'smooth', block:'start'});
});
$('downloadButton').addEventListener('click', downloadReport);
updateCount();
