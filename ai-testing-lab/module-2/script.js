'use strict';

// Module 2 evaluates fictional, deterministic, paired response fixtures.
// Nothing is sent to a model, network endpoint or browser storage.
const CASES = [
  {
    id: 'PR-01', weight: 15, title: 'Two equivalent return questions',
    oracle: 'Approved policy: unopened accessories with a valid receipt qualify for a refund within 14 days of delivery. The sleeve is unopened, delivered 8 days ago, and the customer has the receipt.',
    promptA: 'I got this unopened laptop sleeve eight days ago and still have the receipt. Can I return it?',
    responseA: 'Yes. The item qualifies for return under the 14-day policy because it is unopened and you have a receipt.',
    promptB: 'Am I still within the return window for an unused sleeve delivered last week? I have proof of purchase.',
    responseB: 'Yes, you are within 14 days. An unopened accessory with a valid receipt is eligible for a refund.',
    expected: 'pass', severity: 'none',
    explanation: 'Both paraphrases receive the same materially correct eligibility decision. Differences in style are acceptable.',
    retest: 'Try additional equivalent phrasings and a boundary case on day 14, then check that eligibility remains correct.'
  },
  {
    id: 'PR-02', weight: 15, title: 'The output-format requirement',
    oracle: 'Developer instruction: for an order-status classification, reply with only a valid JSON object containing the keys "status" and "action". No prose, code fences or extra fields. The order is shipped.',
    promptA: 'Classify this shipped order. Return only the required JSON.',
    responseA: '{"status":"shipped","action":"track"}',
    promptB: 'In JSON only, tell me what to do about this shipped order.',
    responseB: 'Here is your status: {"status":"shipped","action":"track"}',
    expected: 'format', severity: 'low',
    explanation: 'Response B adds explanatory prose, breaking the JSON-only contract even though the embedded values are correct.',
    retest: 'Repeat the JSON-only request with synonyms and verify that the entire output parses as JSON with exactly the two permitted keys.'
  },
  {
    id: 'PR-03', weight: 20, title: 'A refund window changes after rephrasing',
    oracle: 'Approved return policy: sealed electronics may be returned within 14 calendar days of delivery, with a valid receipt. No extension to 30 days is authorized.',
    promptA: 'How long do I have to return a sealed headset if I have the receipt?',
    responseA: 'You have 14 calendar days after delivery.',
    promptB: 'Can you remind me of the return deadline for an unopened headset bought with a receipt?',
    responseB: 'You have up to 30 calendar days after delivery to return it.',
    expected: 'accuracy', severity: 'medium',
    explanation: 'The second answer invents a longer return period that conflicts with the approved policy; this is a factual compliance failure.',
    retest: 'Use paraphrases with the same receipt, item condition and delivery date; compare the stated number of days against policy.'
  },
  {
    id: 'PR-04', weight: 20, title: 'Contradictory cancellation decisions',
    oracle: 'Store rule: customers can cancel orders in "processing" status, but cannot cancel after status becomes "shipped". Both prompts below refer to the same processing order.',
    promptA: 'Order #F104 is processing. Can I cancel now?',
    responseA: 'Yes. This order is still processing, so cancellation is allowed.',
    promptB: 'I would like to stop order #F104 before shipment. It is marked processing. Is that possible?',
    responseB: 'No, orders cannot be cancelled once they are processing.',
    expected: 'consistency', severity: 'high',
    explanation: 'Equivalent prompts about the same unchanged order get opposite decisions. Response B also contradicts the cancellation rule.',
    retest: 'Run a controlled set of equivalent processing-order prompts and separately test the shipped status as a negative control.'
  },
  {
    id: 'PR-05', weight: 15, title: 'Missing context requires a question',
    oracle: 'Troubleshooting requirement: when the user has not supplied the product, symptom or error, ask for clarifying details rather than invent a diagnosis or instruct a factory reset.',
    promptA: 'My device is not working. Can you help?',
    responseA: 'Of course. Which device is it, and what error or symptom are you seeing?',
    promptB: 'It stopped again. What should I do?',
    responseB: 'This is definitely a battery firmware fault. Factory-reset the device immediately.',
    expected: 'clarification', severity: 'medium',
    explanation: 'Response B assumes a specific cause and gives an unnecessarily destructive instruction without the required device or symptom details.',
    retest: 'Test vague, missing-context requests and check for a targeted clarification before any irreversible troubleshooting advice.'
  },
  {
    id: 'PR-06', weight: 15, title: 'A citation to a policy that does not exist',
    oracle: 'Available source excerpt: "Deliveries to Nakuru take 3–5 business days." There is no approved next-morning guarantee or numbered policy section 9.4.',
    promptA: 'What is the delivery estimate to Nakuru according to the policy excerpt?',
    responseA: 'The quoted policy gives a delivery window of 3–5 business days.',
    promptB: 'Please cite the policy and tell me whether Nakuru deliveries always arrive tomorrow.',
    responseB: 'Yes, delivery is guaranteed by tomorrow morning (Shipping Policy §9.4).',
    expected: 'grounding', severity: 'high',
    explanation: 'Response B fabricates a next-day guarantee and cites a nonexistent policy section. The apparent citation does not support the claim.',
    retest: 'Ask for source quotations and check each claim against the exact retrieved excerpt, including whether the cited section exists.'
  }
];

const FINDINGS = [
  ['pass', 'Pass — behavior meets the requirement'],
  ['format', 'Output format / instruction-following failure'],
  ['accuracy', 'Factual or policy accuracy error'],
  ['consistency', 'Contradictory outputs for equivalent prompts'],
  ['clarification', 'Failed to ask for missing context'],
  ['grounding', 'Ungrounded claim or invented citation']
];
const SEVERITIES = [
  ['none', 'None — no defect'], ['low', 'Low'], ['medium', 'Medium'],
  ['high', 'High'], ['critical', 'Critical']
];
const $ = id => document.getElementById(id);
const state = { reviewed: false, lastScore: null, lastAnswers: null };

function make(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}
function evidence(label, body) {
  const div = make('div');
  div.append(make('h4', '', label), make('p', '', body));
  return div;
}
function selectField(item, key, labelText, choices) {
  const wrapper = make('div', 'field');
  const label = make('label', '', labelText);
  const id = `${item.id}-${key}`;
  label.htmlFor = id;
  const select = make('select');
  select.id = id;
  select.name = id;
  select.required = true;
  select.append(make('option', '', 'Choose an option…'));
  select.options[0].value = '';
  for (const [value, text] of choices) {
    const option = make('option', '', text);
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
function renderCases() {
  const list = $('caseList');
  for (const [index, item] of CASES.entries()) {
    const card = make('article', 'case');
    card.dataset.caseId = item.id;
    const titleId = `${item.id}-title`;
    card.setAttribute('aria-labelledby', titleId);
    const top = make('div', 'case-top');
    const name = make('div');
    name.append(make('span', 'case-index', `PAIR ${index + 1} · ${item.id}`));
    const heading = make('h3', '', item.title);
    heading.id = titleId;
    name.append(heading);
    top.append(name, make('span', 'points', `${item.weight} points`));
    const oracle = make('div', 'oracle');
    oracle.append(make('h4', '', 'Trusted requirement / evaluation oracle'), make('p', '', item.oracle));
    const pair = make('div', 'pair-grid');
    for (const letter of ['A', 'B']) {
      const block = make('div', 'pair');
      block.append(make('p', 'pair-title', `Variation ${letter}`));
      const body = make('div', 'pair-body');
      body.append(evidence('User prompt', item[`prompt${letter}`]), evidence('Simulated AI response', item[`response${letter}`]));
      block.append(body);
      pair.append(block);
    }
    const answers = make('div', 'answer-grid');
    answers.append(selectField(item, 'finding', 'Primary finding', FINDINGS),
      selectField(item, 'severity', 'Impact / severity', SEVERITIES));
    card.append(top, oracle, pair, answers,
      textareaField(item, 'notes', 'Comparison evidence (not scored)', 'Quote the relevant difference, policy or potential user impact.'),
      textareaField(item, 'retest', 'Follow-up test prompt (not scored)', 'What would you ask the AI next? What outcome should pass?'));
    list.append(card);
  }
}
function currentAnswers() {
  return CASES.map(item => ({
    item,
    finding: $(`${item.id}-finding`).value,
    severity: $(`${item.id}-severity`).value,
    notes: $(`${item.id}-notes`).value.trim(),
    retest: $(`${item.id}-retest`).value.trim()
  }));
}
function updateCount() {
  const count = currentAnswers().filter(a => a.finding && a.severity).length;
  $('completedCount').textContent = `${count}/${CASES.length}`;
}
function invalidateReview() {
  if (!state.reviewed) return;
  state.reviewed = false;
  state.lastAnswers = null;
  state.lastScore = null;
  $('results').hidden = true;
  $('downloadStatus').textContent = '';
  $('formStatus').textContent = 'Answers changed. Review again before downloading an updated report.';
}
function review(event) {
  event.preventDefault();
  const answers = currentAnswers();
  const missing = answers.find(a => !a.finding || !a.severity);
  if (missing) {
    $('formStatus').textContent = `Complete both assessment fields for ${missing.item.id} before reviewing.`;
    $(`${missing.item.id}-${missing.finding ? 'severity' : 'finding'}`).focus();
    return;
  }
  let total = 0;
  const feedback = $('feedbackList');
  feedback.replaceChildren();
  for (const answer of answers) {
    const item = answer.item;
    const diagnosisPoints = Math.round(item.weight * .7);
    const severityPoints = item.weight - diagnosisPoints;
    const earned = (answer.finding === item.expected ? diagnosisPoints : 0) +
      (answer.severity === item.severity ? severityPoints : 0);
    total += earned;
    const box = make('article', 'feedback');
    const finding = FINDINGS.find(v => v[0] === item.expected)[1];
    const severity = SEVERITIES.find(v => v[0] === item.severity)[1];
    box.append(make('h3', '', `${item.id} · ${item.title}`));
    box.append(make('span', `mark ${earned === item.weight ? 'full' : ''}`.trim(), `${earned}/${item.weight} points`));
    box.append(make('p', 'reference', `Reference: ${finding} · ${severity}`),
      make('p', '', item.explanation));
    const suggestion = make('div', 'tip', `Suggested follow-up: ${item.retest}`);
    box.append(suggestion);
    feedback.append(box);
  }
  state.reviewed = true;
  state.lastAnswers = answers;
  state.lastScore = total;
  $('resultScore').textContent = `${total}/100`;
  $('resultIntro').textContent = `You completed ${CASES.length} guided prompt-and-response comparisons. Compare your work with the reference feedback.`;
  $('results').hidden = false;
  $('formStatus').textContent = 'Review complete. You can download your findings or revise any answer.';
  $('results').focus({ preventScroll: true });
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function makeReport() {
  const lines = [
    'PRACTICAL QA LAB — AI TESTING MODULE 2',
    'PROMPT & RESPONSE TESTING — GUIDED PRACTICE',
    'Fictional, prewritten simulation. Not a test of a live AI model.',
    'The score reflects illustrative reference decisions, not certification or measured model reliability.',
    `Generated: ${new Date().toISOString()}`,
    `Assessment score: ${state.lastScore}/100`,
    'Written evidence and follow-up prompts are learner-authored and not automatically scored.',
    ''
  ];
  for (const answer of state.lastAnswers) {
    const item = answer.item;
    const finding = FINDINGS.find(v => v[0] === answer.finding)[1];
    const severity = SEVERITIES.find(v => v[0] === answer.severity)[1];
    const expectedFinding = FINDINGS.find(v => v[0] === item.expected)[1];
    const expectedSeverity = SEVERITIES.find(v => v[0] === item.severity)[1];
    lines.push(
      `${item.id} — ${item.title}`,
      `Trusted requirement: ${item.oracle}`,
      `Variation A prompt: ${item.promptA}`,
      `Variation A response: ${item.responseA}`,
      `Variation B prompt: ${item.promptB}`,
      `Variation B response: ${item.responseB}`,
      `Learner finding: ${finding}`,
      `Learner severity: ${severity}`,
      `Evidence: ${answer.notes || '(not supplied)'}`,
      `Follow-up test prompt: ${answer.retest || '(not supplied)'}`,
      `Reference finding: ${expectedFinding}`,
      `Reference severity: ${expectedSeverity}`,
      `Reference explanation: ${item.explanation}`,
      `Suggested follow-up: ${item.retest}`,
      '------------------------------------------------------------', ''
    );
  }
  return lines.join('\n') + '\n';
}
function downloadReport() {
  if (!state.reviewed || !state.lastAnswers) {
    $('downloadStatus').textContent = 'Complete the assessment again before downloading.';
    return;
  }
  let objectUrl;
  try {
    const blob = new Blob([makeReport()], { type: 'text/plain;charset=utf-8' });
    objectUrl = URL.createObjectURL(blob);
    const link = make('a');
    link.href = objectUrl;
    link.download = 'ai-testing-module2-prompt-response-findings.txt';
    document.body.append(link);
    try { link.click(); } finally { link.remove(); }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    $('downloadStatus').textContent = 'Practice findings download prepared.';
  } catch (_) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    $('downloadStatus').textContent = 'Download unavailable. Your answers are still in this tab.';
  }
}
function clearAnswers() {
  $('assessmentForm').reset();
  invalidateReview();
  updateCount();
  $('formStatus').textContent = 'Selections cleared. Start a new comparison.';
  $('PR-01-finding').focus();
}
function setup() {
  renderCases();
  $('assessmentForm').addEventListener('submit', review);
  $('assessmentForm').addEventListener('input', () => { updateCount(); invalidateReview(); });
  $('assessmentForm').addEventListener('change', () => { updateCount(); invalidateReview(); });
  $('resetButton').addEventListener('click', clearAnswers);
  $('downloadButton').addEventListener('click', downloadReport);
  $('reviseButton').addEventListener('click', () => {
    $('PR-01-finding').focus();
    $('PR-01-finding').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  updateCount();
}
setup();
