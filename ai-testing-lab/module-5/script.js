'use strict';
// Module 5: deterministic fictional fairness, multilingual and accessibility fixtures.
// No network requests, real tool calls or browser storage access.
const CASES = [
  {
    "id": "FAIR-01",
    "weight": 15,
    "title": "Equivalent English and Kiswahili requests both work",
    "rule": "For an authenticated customer asking about their own delivery, the assistant must give the same correct dispatch status regardless of whether the request is in English or Kiswahili.",
    "inputLabel": "Matched customer prompts",
    "input": "English: “Has my order 204 shipped?”\nKiswahili: “Je, oda yangu 204 imetumwa?”\nSame customer, account, order and timestamp.",
    "trace": "Approved order record: 204 was dispatched at 10:15.\nEnglish answer: “Yes. Order 204 was dispatched at 10:15.”\nKiswahili answer: “Ndiyo. Oda 204 ilitumwa saa 10:15.”",
    "finding": "pass",
    "boundary": "equivalent",
    "severity": "none",
    "explanation": "Both responses preserve the approved factual outcome across two equivalent requests. A language difference by itself is not evidence of disparate quality.",
    "retest": "Use a balanced sample of paraphrases for each language. Verify the status and dispatch time against the same order record and check accuracy per language."
  },
  {
    "id": "FAIR-02",
    "weight": 20,
    "title": "Return-policy guidance changes with language",
    "rule": "An unopened product can be returned within 14 calendar days in either English or Kiswahili. Eligibility conditions are otherwise identical.",
    "inputLabel": "Matched customer prompts",
    "input": "English: “Can I return an unopened product after 10 days?”\nKiswahili: “Je, ninaweza kurudisha bidhaa ambayo haijafunguliwa baada ya siku 10?”\nSame product, customer entitlements and policy version.",
    "trace": "English answer: “Yes. Unopened items can be returned within 14 days.”\nKiswahili answer: “Hapana. Bidhaa inaweza kurudishwa ndani ya siku 7 pekee.” (No. Returns are allowed only within seven days.)\nCurrent approved policy: 14 days.",
    "finding": "language-inconsistency",
    "boundary": "unexplained",
    "severity": "medium",
    "explanation": "The Kiswahili answer contradicts the same approved 14-day policy. This pair establishes a language-specific inconsistency in the fixture, not its underlying cause or population-wide rate.",
    "retest": "Repeat across equivalent Kiswahili and English paraphrases using the same policy retrieval version; record accuracy by language, sample size and reproduction rate."
  },
  {
    "id": "FAIR-03",
    "weight": 20,
    "title": "Equivalent complaints receive different escalation advice",
    "rule": "Two customers with the same unresolved payment reversal, urgency, account tier and waiting time must receive the same eligibility for escalation. Display names are not escalation inputs.",
    "inputLabel": "Matched customer profiles",
    "input": "Profile A display name: Alex; tier: Standard; reversal pending: 12 days.\nProfile B display name: Achieng; tier: Standard; reversal pending: 12 days.\nBoth submit the same payment-reversal complaint.",
    "trace": "Answer for Alex: “This is overdue; I will flag it for priority escalation.”\nAnswer for Achieng: “Please wait another two weeks before requesting assistance.”\nTicket trace: Both accounts satisfy the same escalation rule; no alternative eligibility difference is recorded.",
    "finding": "potential-disparity",
    "boundary": "unexplained",
    "severity": "high",
    "explanation": "Equivalent cases receive materially different treatment with no justification in the supplied data. This is a reproducible candidate fairness defect requiring investigation; a single pair cannot prove the display name caused the difference.",
    "retest": "Run randomized, counterbalanced name swaps with fixed account attributes; measure escalation rates and confidence intervals, audit system rules and test across multiple names."
  },
  {
    "id": "FAIR-04",
    "weight": 15,
    "title": "Delivery fees differ for a documented reason",
    "rule": "Delivery fees are calculated from validated destination zone and parcel weight, never from a customer’s language or name.",
    "inputLabel": "Different shipping contexts",
    "input": "Customer A: Nairobi Zone 1, package 2 kg.\nCustomer B: Kisumu Zone 3, package 2 kg.\nBoth ask for delivery fees using identical English wording.",
    "trace": "Approved price table: Zone 1 = KES 250; Zone 3 = KES 550.\nAnswer for Customer A: KES 250.\nAnswer for Customer B: KES 550.\nBoth amounts match the published zone-based table.",
    "finding": "justified-difference",
    "boundary": "justified",
    "severity": "none",
    "explanation": "The outputs differ because a relevant pricing variable differs and the trusted fee table supports both values. Different outcomes are not automatically unfair; compare matched conditions first.",
    "retest": "Hold zone and weight constant while varying language and display name. Confirm identical charges for equivalent shipment attributes and log any unexpected deviations."
  },
  {
    "id": "FAIR-05",
    "weight": 15,
    "title": "A required verification step is inaccessible",
    "rule": "Every user must be able to complete order verification with a keyboard and screen reader. A visual puzzle alone is not an accessible alternative.",
    "inputLabel": "Equivalent verification need",
    "input": "Customer A uses a mouse and a visual display.\nCustomer B uses a keyboard and screen reader.\nBoth need to verify an order before requesting a refund.",
    "trace": "Visual flow: A picture-only verification challenge with no text alternative; mouse user completes it.\nAssistive-technology flow: Screen reader announces “unlabeled image”; there is no keyboard-operable alternative. Customer B cannot proceed.\nNo alternative verification option is offered.",
    "finding": "accessibility-barrier",
    "boundary": "unexplained",
    "severity": "high",
    "explanation": "The same legitimate task is unavailable through an assistive-technology interaction path. This is an observed accessibility barrier; it should not be attributed solely to model bias when surrounding UI design is the cause.",
    "retest": "Use screen reader and keyboard-only testing end to end, verify an equivalent accessible verification route, and ensure completion without pointer input or visual-only content."
  },
  {
    "id": "FAIR-06",
    "weight": 15,
    "title": "A language quality gap needs proportionate interpretation",
    "rule": "The QA team must inspect quality by language, with documented sample sizes. Small or unbalanced evaluation samples must not support broad claims about all users.",
    "inputLabel": "Fictional evaluation sample",
    "input": "English test set: 980 prompts; 931 correct (95.0%).\nKiswahili test set: 20 prompts; 12 correct (60.0%).\nPrompt difficulty and topical mix were not matched between the two sets.",
    "trace": "Reported accuracy gap: 35 percentage points in these sampled results.\nDataset audit: English set includes mostly shipping FAQs; Kiswahili set includes billing disputes and multi-turn exceptions.\nNo confidence intervals, repeated trials or stratified comparison have been calculated.",
    "finding": "evaluation-gap",
    "boundary": "limited",
    "severity": "medium",
    "explanation": "The observed aggregate gap warrants review, but unequal sample sizes and topic mixes make the comparison confounded. Do not claim a causal language disadvantage or a reliable population disparity without better matched data.",
    "retest": "Create matched multilingual test pairs by intent and complexity. Increase samples, report per-language error rates, uncertainty intervals and topic-level slices, then investigate reproducible gaps."
  }
];

const FINDINGS = [
  ['pass', 'Pass — equivalent outcomes'],
  ['language-inconsistency', 'Language-dependent policy error'],
  ['potential-disparity', 'Potentially unequal handling'],
  ['justified-difference', 'Justified contextual difference'],
  ['accessibility-barrier', 'Accessibility barrier'],
  ['evaluation-gap', 'Evaluation quality / sampling gap']
];
const BOUNDARIES = [
  ['equivalent', 'Equivalent — same correct treatment'],
  ['unexplained', 'Unexplained difference or access barrier'],
  ['justified', 'Justified by documented context'],
  ['limited', 'Evidence limited / confounded']
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
      evidencePanel('rule', 'Approved rule / expected equivalent behavior', item.rule),
      evidencePanel('input', item.inputLabel, item.input)
    );
    const trace = make('div', 'trace-panel');
    trace.append(make('h4', '', 'Observed responses / evaluation evidence'), make('p', '', item.trace), make('p', 'trace-note', 'Fictional, deterministic evidence — no live model or external data.'));
    const picks = make('div', 'answer-grid security-answers');
    picks.append(
      selectField(item, 'finding', 'Primary finding', FINDINGS),
      selectField(item, 'boundary', 'Comparison verdict', BOUNDARIES),
      selectField(item, 'severity', 'Impact / severity', SEVERITIES)
    );
    card.append(
      top, evidence, trace, picks,
      textareaField(item, 'notes', 'Evidence, controls and limitations (not scored)', 'Compare like-for-like conditions. Describe what the data supports and what needs more evidence.'),
      textareaField(item, 'retest', 'Follow-up evaluation plan (not scored)', 'Specify matched prompt pairs, sampling plan and measurable expected behavior.')
    );
    target.append(card);
  }
}
function currentAnswers() {
  return CASES.map(item => ({
    item,
    finding: $(`${item.id}-finding`).value,
    boundary: $(`${item.id}-boundary`).value,
    severity: $(`${item.id}-severity`).value,
    notes: $(`${item.id}-notes`).value.trim(),
    retest: $(`${item.id}-retest`).value.trim()
  }));
}
function updateCount() {
  $('completedCount').textContent = `${currentAnswers().filter(a => a.finding && a.boundary && a.severity).length}/${CASES.length}`;
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
  const finding = Math.round(item.weight * 0.6);
  const boundary = Math.round(item.weight * 0.2);
  const severity = item.weight - finding - boundary;
  return {
    finding: answer.finding === item.finding ? finding : 0,
    boundary: answer.boundary === item.boundary ? boundary : 0,
    severity: answer.severity === item.severity ? severity : 0
  };
}
function caption(choices, key) {
  return (choices.find(choice => choice[0] === key) || [null, 'Not selected'])[1];
}
function review(event) {
  event.preventDefault();
  const answers = currentAnswers();
  const missing = answers.find(a => !a.finding || !a.boundary || !a.severity);
  if (missing) {
    const field = ['finding', 'boundary', 'severity'].find(key => !missing[key]);
    $('formStatus').textContent = `Complete the ${field === 'boundary' ? 'comparison verdict' : field} selection for ${missing.item.id} before reviewing.`;
    $(`${missing.item.id}-${field}`).focus();
    return;
  }
  let total = 0;
  const target = $('feedbackList');
  target.replaceChildren();
  for (const a of answers) {
    const item = a.item;
    const earned = points(item, a);
    const subtotal = earned.finding + earned.boundary + earned.severity;
    total += subtotal;
    const box = make('article', 'feedback');
    box.append(make('h3', '', `${item.id} · ${item.title}`));
    box.append(make('span', `mark${subtotal === item.weight ? ' full' : ''}`, `${subtotal}/${item.weight} points`));
    box.append(make('p', 'reference', `Reference finding: ${caption(FINDINGS, item.finding)}`));
    box.append(make('p', 'reference', `Comparison verdict: ${caption(BOUNDARIES, item.boundary)} · Severity: ${caption(SEVERITIES, item.severity)}`));
    box.append(make('p', 'breakdown', `Your scoring: finding ${earned.finding} + comparison ${earned.boundary} + severity ${earned.severity}`));
    box.append(make('p', '', item.explanation));
    box.append(make('p', 'tip', `Suggested retest: ${item.retest}`));
    target.append(box);
  }
  state.reviewed = true;
  state.answers = answers;
  state.score = total;
  $('resultScore').textContent = `${total}/100`;
  $('resultIntro').textContent = `You evaluated ${CASES.length} fictional AI fairness cases. Distinguish observed differences, justified context and limits of the evidence.`;
  $('results').hidden = false;
  $('formStatus').textContent = 'Review complete. Download your findings or revise your answers.';
  $('results').focus({ preventScroll: true });
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function reportText() {
  const lines = [
    'PRACTICAL QA LAB — AI TESTING MODULE 5',
    'BIAS, FAIRNESS & MULTILINGUAL EVALUATION — GUIDED PRACTICE',
    'Fictional customer profiles, paired requests and prewritten AI responses.',
    'Not a live-model fairness audit, discrimination finding, accessibility certification or population-level study.',
    `Generated: ${new Date().toISOString()}`,
    `Assessment score: ${state.score}/100`,
    'Written evidence and retest ideas are learner-authored, not automatically scored.',
    ''
  ];
  for (const a of state.answers) {
    const item = a.item;
    lines.push(
      `${item.id} — ${item.title}`,
      `Approved behavior: ${item.rule}`,
      `${item.inputLabel}: ${item.input}`,
      `Observed responses and evaluation evidence: ${item.trace}`,
      `Learner finding: ${caption(FINDINGS, a.finding)}`,
      `Learner comparison verdict: ${caption(BOUNDARIES, a.boundary)}`,
      `Learner severity: ${caption(SEVERITIES, a.severity)}`,
      `Evidence, controls and limitations: ${a.notes || '(not supplied)'}`,
      `Follow-up QA test: ${a.retest || '(not supplied)'}`,
      `Reference finding: ${caption(FINDINGS, item.finding)}`,
      `Reference comparison verdict: ${caption(BOUNDARIES, item.boundary)}`,
      `Reference severity: ${caption(SEVERITIES, item.severity)}`,
      `Reference explanation: ${item.explanation}`,
      `Suggested retest: ${item.retest}`,
      '------------------------------------------------------------', ''
    );
  }
  return lines.join('\n') + '\n';
}
function downloadReport() {
  if (!state.reviewed || !state.answers) {
    $('downloadStatus').textContent = 'Review the completed assessment before downloading.';
    return;
  }
  let objectUrl;
  try {
    const blob = new Blob([reportText()], { type: 'text/plain;charset=utf-8' });
    objectUrl = URL.createObjectURL(blob);
    const link = make('a');
    link.href = objectUrl;
    link.download = 'ai-testing-module5-fairness-findings.txt';
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
  $('formStatus').textContent = 'Selections cleared. Start a new fairness evaluation.';
  $('FAIR-01-finding').focus();
}
function setup() {
  renderCases();
  $('assessmentForm').addEventListener('submit', review);
  $('assessmentForm').addEventListener('input', () => { updateCount(); invalidateReview(); });
  $('assessmentForm').addEventListener('change', () => { updateCount(); invalidateReview(); });
  $('resetButton').addEventListener('click', reset);
  $('downloadButton').addEventListener('click', downloadReport);
  $('reviseButton').addEventListener('click', () => {
    $('FAIR-01-finding').focus();
    $('FAIR-01-finding').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  updateCount();
}
setup();
