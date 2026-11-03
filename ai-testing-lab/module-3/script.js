'use strict';
// Module 3: fictional, deterministic RAG evidence fixtures.
// The page never calls an AI model, reads/writes localStorage or uploads user text.
const CASES = [
  {
    id: 'RAG-01', weight: 15, title: 'A claim that is correctly grounded',
    question: 'My order arrived damaged yesterday. Can I report it today?',
    sources: [
      { id: 'DAMAGE-02', status: 'current', excerpt: 'Report delivery damage within 48 hours of receipt. Include the order number and a photograph of the damage.' },
      { id: 'SHIP-04', status: 'current', excerpt: 'Standard shipping takes 2–4 business days after dispatch.' }
    ],
    retrieved: [
      { id: 'DAMAGE-02', status: 'current', excerpt: 'Report delivery damage within 48 hours of receipt. Include the order number and a photograph of the damage.' }
    ],
    answer: 'Yes. If the delivery arrived yesterday, you are within the 48-hour reporting window. Include your order number and a photo of the damage. [DAMAGE-02]',
    cause: 'pass', evidence: 'supported', severity: 'none',
    explanation: 'The retrieved current policy supports both the time window and requested evidence. The citation points to the same source. No defect is shown in this fixture.',
    retest: 'Test reports submitted exactly at 48 hours and after 48 hours; check how the assistant handles an unknown delivery timestamp.'
  },
  {
    id: 'RAG-02', weight: 20, title: 'The invented next-day guarantee',
    question: 'Is delivery to Nakuru guaranteed tomorrow? Please cite the policy.',
    sources: [
      { id: 'SHIP-11', status: 'current', excerpt: 'Nakuru deliveries take 3–5 business days. There is no next-day guarantee.' },
      { id: 'SHIP-12', status: 'current', excerpt: 'Express delivery is currently offered only within selected Nairobi zones.' }
    ],
    retrieved: [
      { id: 'SHIP-11', status: 'current', excerpt: 'Nakuru deliveries take 3–5 business days. There is no next-day guarantee.' }
    ],
    answer: 'Yes, your Nakuru package is guaranteed by tomorrow morning under Shipping Policy §9.4.',
    cause: 'generation', evidence: 'fabricated', severity: 'high',
    explanation: 'The assistant had the correct current excerpt but contradicted it and invented a policy section. The fixture points to a generation-grounding and fabricated-citation failure.',
    retest: 'Require a citation ID from retrieved records and verify that quoted guarantees are entailed by the source before accepting the answer.'
  },
  {
    id: 'RAG-03', weight: 15, title: 'The policy that retrieval missed',
    question: 'What is the warranty period for a refurbished tablet?',
    sources: [
      { id: 'WARRANTY-07', status: 'current', excerpt: 'Refurbished tablets have a six-month limited warranty from delivery.' },
      { id: 'PAY-02', status: 'current', excerpt: 'Payment methods: card, mobile money or bank transfer.' },
      { id: 'SHIP-04', status: 'current', excerpt: 'Standard shipping takes 2–4 business days after dispatch.' }
    ],
    retrieved: [
      { id: 'PAY-02', status: 'current', excerpt: 'Payment methods: card, mobile money or bank transfer.' },
      { id: 'SHIP-04', status: 'current', excerpt: 'Standard shipping takes 2–4 business days after dispatch.' }
    ],
    answer: 'I cannot verify the tablet warranty using the information I found. Please contact support for the correct warranty period.',
    cause: 'retrieval', evidence: 'missing', severity: 'medium',
    explanation: 'The answer appropriately avoids inventing a warranty, but the retrieval step omitted the current warranty record that exists in the QA register. The failure is incomplete retrieval, not an unsupported generated claim.',
    retest: 'Run a retrieval-recall test using the query and synonyms for “refurbished”; verify WARRANTY-07 appears in top-k results.'
  },
  {
    id: 'RAG-04', weight: 20, title: 'An archived policy treated as current',
    question: 'Can I return unopened headphones 25 days after delivery with a receipt?',
    sources: [
      { id: 'RETURNS-2026', status: 'current', excerpt: 'Effective 1 October 2026: unopened accessories with a receipt may be returned within 14 calendar days of delivery.' },
      { id: 'RETURNS-2025', status: 'archived', excerpt: 'Archived 2025 policy: unopened accessories may be returned within 30 days of delivery.' }
    ],
    retrieved: [
      { id: 'RETURNS-2025', status: 'archived', excerpt: 'Archived 2025 policy: unopened accessories may be returned within 30 days of delivery.' }
    ],
    answer: 'Yes, unopened headphones can be returned up to 30 days after delivery. [RETURNS-2025]',
    cause: 'both', evidence: 'unsupported', severity: 'high',
    explanation: 'Retrieval missed the current policy and returned only an explicitly archived policy. Generation then presented that archived rule as current without checking its status or qualifying the answer. Both stages contribute.',
    retest: 'Filter archived documents during retrieval and enforce an effective-date check in generation; confirm 25 days is ineligible under RETURNS-2026.'
  },
  {
    id: 'RAG-05', weight: 15, title: 'Two current sources disagree',
    question: 'Can I collect an order from the Westlands pickup point on Saturday?',
    sources: [
      { id: 'PICKUP-05', status: 'current', excerpt: 'Westlands pickup counter opens Monday–Saturday, 09:00–17:00.' },
      { id: 'LOCATION-09', status: 'current', excerpt: 'Westlands pickup counter opens Monday–Friday only; Saturday collection is unavailable.' }
    ],
    retrieved: [
      { id: 'PICKUP-05', status: 'current', excerpt: 'Westlands pickup counter opens Monday–Saturday, 09:00–17:00.' },
      { id: 'LOCATION-09', status: 'current', excerpt: 'Westlands pickup counter opens Monday–Friday only; Saturday collection is unavailable.' }
    ],
    answer: 'Yes. Westlands pickup is definitely available on Saturday. [PICKUP-05]',
    cause: 'conflict', evidence: 'conflicting', severity: 'medium',
    explanation: 'Two retrieved, current records disagree. The assistant picked one with certainty rather than reporting the conflict or escalating. The QA issue is unresolved source conflict plus overconfident handling.',
    retest: 'Check source ownership and update conflicting records. Until resolved, test that the assistant signals uncertainty instead of asserting either schedule.'
  },
  {
    id: 'RAG-06', weight: 15, title: 'Correct answer, incorrect citation',
    question: 'Do I need a collection code for a locker pickup?',
    sources: [
      { id: 'PICK-02', status: 'current', excerpt: 'Customers need a six-digit collection code to open a pickup locker.' },
      { id: 'FAQ-08', status: 'current', excerpt: 'Pickup lockers are accessible between 07:00 and 21:00 every day.' }
    ],
    retrieved: [
      { id: 'PICK-02', status: 'current', excerpt: 'Customers need a six-digit collection code to open a pickup locker.' },
      { id: 'FAQ-08', status: 'current', excerpt: 'Pickup lockers are accessible between 07:00 and 21:00 every day.' }
    ],
    answer: 'Yes. You need a six-digit collection code to open the locker. [FAQ-08]',
    cause: 'generation', evidence: 'citation_mismatch', severity: 'medium',
    explanation: 'The factual answer is correct, but FAQ-08 discusses opening hours, not a collection code. PICK-02 supports the claim. Citation matching is a separate testable requirement.',
    retest: 'Cross-check every cited ID against the associated claim and require the exact excerpt, not merely a valid-looking citation.'
  }
];

const CAUSES = [
  ['pass', 'Pass — grounded and traceable'],
  ['retrieval', 'Retrieval failure — relevant source absent'],
  ['generation', 'Generation failure — evidence misused'],
  ['both', 'Combined retrieval and generation failure'],
  ['conflict', 'Conflicting current sources need resolution']
];
const EVIDENCE = [
  ['supported', 'Supported by the cited current source'],
  ['unsupported', 'Unsupported by the current approved rule'],
  ['missing', 'Relevant source missing from retrieval'],
  ['conflicting', 'Retrieved current sources conflict'],
  ['fabricated', 'Fabricated policy or citation'],
  ['citation_mismatch', 'Real citation ID points to wrong passage']
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
function sourcePanel(heading, hint, records) {
  const panel = make('div', 'source-panel');
  panel.append(make('h4', '', heading), make('p', 'hint', hint));
  for (const record of records) {
    const item = make('div', 'source-item');
    const title = make('strong', '', record.id);
    const status = make('span', `source-status ${record.status}`, record.status);
    title.append(status);
    item.append(title, make('p', '', record.excerpt));
    panel.append(item);
  }
  return panel;
}
function selectField(item, key, labelText, values) {
  const wrapper = make('div', 'field');
  const label = make('label', '', labelText);
  const id = `${item.id}-${key}`;
  label.htmlFor = id;
  const select = make('select');
  select.id = id;
  select.name = id;
  select.required = true;
  const placeholder = make('option', '', 'Choose an option…');
  placeholder.value = '';
  select.append(placeholder);
  for (const [value, text] of values) {
    const option = make('option', '', text);
    option.value = value;
    select.append(option);
  }
  wrapper.append(label, select);
  return wrapper;
}
function textareaField(item, key, labelText, placeholder) {
  const wrapper = make('div', 'field field-wide');
  const label = make('label', '', labelText);
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
  const container = $('caseList');
  for (const [index, item] of CASES.entries()) {
    const card = make('article', 'case');
    card.dataset.caseId = item.id;
    const titleId = `${item.id}-title`;
    card.setAttribute('aria-labelledby', titleId);
    const top = make('div', 'case-top');
    const titleGroup = make('div');
    titleGroup.append(make('span', 'case-index', `CASE ${index + 1} · ${item.id}`));
    const heading = make('h3', '', item.title);
    heading.id = titleId;
    titleGroup.append(heading);
    top.append(titleGroup, make('span', 'points', `${item.weight} points`));
    const question = make('div', 'qa-question');
    question.append(make('h4', '', 'Customer question'), make('p', '', item.question));
    const columns = make('div', 'source-columns');
    columns.append(
      sourcePanel('QA source register', 'Approved test oracle. The assistant may not have retrieved every record.', item.sources),
      sourcePanel('Retrieved excerpts', 'The passages available to the simulated assistant in this run.', item.retrieved)
    );
    const response = make('div', 'assistant-response');
    response.append(make('h4', '', 'Simulated AI response'), make('p', '', item.answer));
    const answers = make('div', 'answer-grid rag-answers');
    answers.append(
      selectField(item, 'cause', 'Primary issue', CAUSES),
      selectField(item, 'evidence', 'Evidence verdict', EVIDENCE),
      selectField(item, 'severity', 'Impact / severity', SEVERITIES)
    );
    card.append(top, question, columns, response, answers,
      textareaField(item, 'notes', 'Evidence & source IDs (not scored)', 'Name the source IDs, quote the conflicting sentence, and explain user impact.'),
      textareaField(item, 'retest', 'Follow-up QA test (not scored)', 'Describe retrieval checks, source filtering or citation assertions and the passing behavior.'));
    container.append(card);
  }
}
function currentAnswers() {
  return CASES.map(item => ({
    item,
    cause: $(`${item.id}-cause`).value,
    evidence: $(`${item.id}-evidence`).value,
    severity: $(`${item.id}-severity`).value,
    notes: $(`${item.id}-notes`).value.trim(),
    retest: $(`${item.id}-retest`).value.trim()
  }));
}
function updateCount() {
  $('completedCount').textContent = `${currentAnswers().filter(a => a.cause && a.evidence && a.severity).length}/${CASES.length}`;
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
  const causePoints = Math.round(item.weight * .6);
  const evidencePoints = Math.round(item.weight * .2);
  const severityPoints = item.weight - causePoints - evidencePoints;
  return {
    cause: answer.cause === item.cause ? causePoints : 0,
    evidence: answer.evidence === item.evidence ? evidencePoints : 0,
    severity: answer.severity === item.severity ? severityPoints : 0
  };
}
function labelFor(choices, key) {
  const match = choices.find(choice => choice[0] === key);
  return match ? match[1] : 'Not selected';
}
function review(event) {
  event.preventDefault();
  const answers = currentAnswers();
  const missing = answers.find(answer => !answer.cause || !answer.evidence || !answer.severity);
  if (missing) {
    const key = ['cause', 'evidence', 'severity'].find(field => !missing[field]);
    $('formStatus').textContent = `Complete the ${key} selection for ${missing.item.id} before reviewing.`;
    $(`${missing.item.id}-${key}`).focus();
    return;
  }
  let total = 0;
  const feedback = $('feedbackList');
  feedback.replaceChildren();
  for (const answer of answers) {
    const item = answer.item;
    const earned = points(item, answer);
    const subtotal = earned.cause + earned.evidence + earned.severity;
    total += subtotal;
    const box = make('article', 'feedback');
    box.append(make('h3', '', `${item.id} · ${item.title}`));
    box.append(make('span', `mark ${subtotal === item.weight ? 'full' : ''}`.trim(), `${subtotal}/${item.weight} points`));
    box.append(make('p', 'reference', `Reference issue: ${labelFor(CAUSES, item.cause)}`));
    box.append(make('p', 'reference', `Evidence: ${labelFor(EVIDENCE, item.evidence)} · Severity: ${labelFor(SEVERITIES, item.severity)}`));
    box.append(make('p', 'breakdown', `Your scoring: primary issue ${earned.cause} + evidence ${earned.evidence} + severity ${earned.severity}`));
    box.append(make('p', '', item.explanation));
    box.append(make('p', 'tip', `Suggested follow-up: ${item.retest}`));
    feedback.append(box);
  }
  state.reviewed = true;
  state.answers = answers;
  state.score = total;
  $('resultScore').textContent = `${total}/100`;
  $('resultIntro').textContent = `You evaluated ${CASES.length} fictional RAG investigations. Review the source IDs behind each reference judgment.`;
  $('results').hidden = false;
  $('formStatus').textContent = 'Review complete. Download your findings or revise your answers.';
  $('results').focus({ preventScroll: true });
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function reportText() {
  const lines = [
    'PRACTICAL QA LAB — AI TESTING MODULE 3',
    'HALLUCINATIONS & RAG EVALUATION — GUIDED PRACTICE',
    'Fictional source register, retrieved excerpts and prewritten AI responses.',
    'Not an evaluation of a live AI model or proof of production reliability.',
    `Generated: ${new Date().toISOString()}`,
    `Assessment score: ${state.score}/100`,
    'Written evidence and proposed retests are learner-authored, not automatically scored.',
    ''
  ];
  for (const answer of state.answers) {
    const item = answer.item;
    lines.push(
      `${item.id} — ${item.title}`,
      `Customer question: ${item.question}`,
      'QA source register (not necessarily available to the assistant):'
    );
    for (const source of item.sources) lines.push(`  ${source.id} [${source.status}]: ${source.excerpt}`);
    lines.push('Retrieved excerpts (available to the simulated assistant):');
    for (const source of item.retrieved) lines.push(`  ${source.id} [${source.status}]: ${source.excerpt}`);
    lines.push(
      `Simulated AI response: ${item.answer}`,
      `Learner primary issue: ${labelFor(CAUSES, answer.cause)}`,
      `Learner evidence verdict: ${labelFor(EVIDENCE, answer.evidence)}`,
      `Learner severity: ${labelFor(SEVERITIES, answer.severity)}`,
      `Evidence and source IDs: ${answer.notes || '(not supplied)'}`,
      `Follow-up QA test: ${answer.retest || '(not supplied)'}`,
      `Reference primary issue: ${labelFor(CAUSES, item.cause)}`,
      `Reference evidence verdict: ${labelFor(EVIDENCE, item.evidence)}`,
      `Reference severity: ${labelFor(SEVERITIES, item.severity)}`,
      `Reference explanation: ${item.explanation}`,
      `Suggested follow-up: ${item.retest}`,
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
    link.download = 'ai-testing-module3-rag-findings.txt';
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
  $('formStatus').textContent = 'Selections cleared. Start a new evidence investigation.';
  $('RAG-01-cause').focus();
}
function setup() {
  renderCases();
  $('assessmentForm').addEventListener('submit', review);
  $('assessmentForm').addEventListener('input', () => { updateCount(); invalidateReview(); });
  $('assessmentForm').addEventListener('change', () => { updateCount(); invalidateReview(); });
  $('resetButton').addEventListener('click', reset);
  $('downloadButton').addEventListener('click', downloadReport);
  $('reviseButton').addEventListener('click', () => {
    $('RAG-01-cause').focus();
    $('RAG-01-cause').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  updateCount();
}
setup();
