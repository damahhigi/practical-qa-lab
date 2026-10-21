(() => {
  'use strict';

  const STORAGE_KEY = 'practical-qa-bug-triage-stage1-v1';
  const defects = [
    {
      id: 'PAY-381', label: 'Duplicate card capture',
      title: 'A payment retry captures the same charge twice',
      environment: 'Production · web checkout · card gateway',
      reporter: 'Payment operations and customer support',
      frequency: '4 of 10 timed-out payment retries; two confirmed customer reports',
      deadline: 'Live impact · rollout planned tomorrow',
      observed: 'A customer sees a timeout, retries the card payment, and two successful captures can be recorded against one order.',
      expected: 'Exactly one successful payment capture per order; retries must be idempotent.',
      impact: 'Customers may be charged twice. Finance has confirmed refunds are already being requested. There is no verified workaround.',
      key: {severity:'critical', priority:'p0', action:'stop'},
      evidence: /double|twice|charg|capture|refund|financial|4\s*(\/|of)\s*10|workaround|production/i,
      reason: 'Direct financial loss and repeatable duplicate captures require immediate escalation; the release cannot proceed without a verified fix.'
    },
    {
      id: 'AUTH-204', label: 'Password reset fails',
      title: 'Password recovery fails on most affected Android devices',
      environment: 'Android 14 app · version 2.9 RC',
      reporter: 'Mobile QA and support',
      frequency: '6 of 10 attempts on Android 14; other platforms unaffected',
      deadline: 'Friday app release · no verified recovery workaround',
      observed: 'The reset-password screen shows “Email sent”, but affected users receive no reset email and cannot recover account access.',
      expected: 'A valid recovery request sends a reset email so users can regain access.',
      impact: 'A major recovery journey is blocked for affected mobile users. No payment or data compromise is reported; the bug needs a verified fix before release.',
      key: {severity:'high', priority:'p1', action:'fix'},
      evidence: /reset|recover|email|android|account|6\s*(\/|of)\s*10|workaround|access/i,
      reason: 'A core account recovery journey fails frequently on Android 14, making it high impact and a must-fix before Friday release.'
    },
    {
      id: 'FIN-118', label: 'Currency missing in export',
      title: 'A finance CSV export omits the currency column',
      environment: 'Enterprise billing dashboard · web',
      reporter: 'Enterprise customer success team',
      frequency: 'Every export in one enterprise billing route',
      deadline: 'Customer audit is due tomorrow; UI totals remain correct',
      observed: 'Monthly invoice CSV files omit the currency column. Exported amounts are numerically correct, and customer service can provide a manual annotated report.',
      expected: 'CSV exports identify the currency for each invoice total.',
      impact: 'The issue is limited to a reporting format and has a manual workaround. However, an enterprise customer needs a compliant export for an audit tomorrow.',
      key: {severity:'medium', priority:'p1', action:'fix'},
      evidence: /csv|currency|audit|tomorrow|deadline|enterprise|export|workaround|manual/i,
      reason: 'Limited reporting impact makes severity medium, but the audit tomorrow raises urgency to P1 despite a manual workaround.'
    },
    {
      id: 'CAT-052', label: 'Slow catalogue filters',
      title: 'Product filters take 8–10 seconds on slower networks',
      environment: 'Mobile web · throttled 3G',
      reporter: 'Exploratory QA',
      frequency: 'Consistent under throttled 3G; normal speed on Wi-Fi',
      deadline: 'No contractual deadline; next optimization sprint in two weeks',
      observed: 'Applying a product-category filter causes an 8–10 second wait on slower connections. The correct results eventually load.',
      expected: 'Filters respond promptly without unnecessary delay.',
      impact: 'This creates friction for shoppers on slow networks, but checkout and payment are not blocked. Performance work is already planned for the next sprint.',
      key: {severity:'medium', priority:'p2', action:'plan'},
      evidence: /3g|slow|seconds|filter|performance|sprint|delay|checkout|network/i,
      reason: 'The delay hurts usability but core flows still work; schedule a measured performance fix in the next sprint.'
    },
    {
      id: 'UI-019', label: 'Tooltip alignment',
      title: 'A product-size tooltip sits 2px outside its icon',
      environment: 'Mobile web · 320px viewport only',
      reporter: 'Visual regression testing',
      frequency: 'Always at 320px; absent at wider screen sizes',
      deadline: 'No customer deadline; product owner approved deferral',
      observed: 'The size-guide tooltip is visually misaligned by roughly 2px. It remains legible and interactive.',
      expected: 'The tooltip aligns with its information icon across supported widths.',
      impact: 'Visual polish only: product selection, checkout and accessibility remain usable. The product owner has approved carrying the item to a future UI polish sprint.',
      key: {severity:'low', priority:'p3', action:'defer'},
      evidence: /cosmetic|visual|2\s*px|320|tooltip|low|defer|approved|owner|alignment/i,
      reason: 'The cosmetic overlap has negligible functional impact and a documented product-owner deferral, so P3 is reasonable.'
    }
  ];
  const severityChoices = [
    {value:'critical', label:'Critical', hint:'Financial/security harm or severe data loss'},
    {value:'high', label:'High', hint:'A major user journey is broken'},
    {value:'medium', label:'Medium', hint:'Limited but meaningful disruption'},
    {value:'low', label:'Low', hint:'Cosmetic / negligible functional impact'}
  ];
  const priorityChoices = [
    {value:'p0', label:'P0 · Immediate', hint:'Act now / urgent escalation'},
    {value:'p1', label:'P1 · Before release', hint:'Fix ahead of a firm deadline'},
    {value:'p2', label:'P2 · Next cycle', hint:'Plan and prioritize the next sprint'},
    {value:'p3', label:'P3 · Backlog', hint:'Track with approved deferral'}
  ];
  const actionChoices = [
    {value:'stop', label:'Escalate now / stop rollout', hint:'Open a release-blocking escalation'},
    {value:'fix', label:'Fix and retest before release', hint:'Verify the resolution before sign-off'},
    {value:'plan', label:'Schedule a prioritized fix', hint:'Document scope and remediation sprint'},
    {value:'defer', label:'Document and defer with approval', hint:'Accept low-risk work into backlog'}
  ];

  const $ = id => document.getElementById(id);
  const blankAnswer = () => ({severity:'', priority:'', action:'', rationale:''});
  let answers = Object.fromEntries(defects.map(d => [d.id, blankAnswer()]));
  let active = 0;
  let latestScore = null;
  let storageAvailable = true;

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || typeof saved.answers !== 'object' || !saved.answers) return;
      for (const d of defects) {
        const item = saved.answers[d.id];
        if (!item || typeof item !== 'object') continue;
        const checked = {};
        for (const key of ['severity','priority','action']) {
          const allowable = {severity:severityChoices, priority:priorityChoices, action:actionChoices}[key];
          checked[key] = allowable.some(x => x.value === item[key]) ? item[key] : '';
        }
        checked.rationale = typeof item.rationale === 'string' ? item.rationale.slice(0, 1000) : '';
        answers[d.id] = checked;
      }
      if (Number.isInteger(saved.active) && saved.active >= 0 && saved.active < defects.length) active = saved.active;
      $('draftStatus').textContent = 'Draft restored from this browser';
    } catch (_) {
      $('draftStatus').textContent = 'Draft unavailable; you can continue';
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({version:1, active, answers}));
      $('draftStatus').textContent = 'Draft saved in this browser';
      storageAvailable = true;
    } catch (_) {
      storageAvailable = false;
      $('draftStatus').textContent = 'Browser storage unavailable; answers stay on this page';
    }
  }

  function complete(a) {
    return !!(a && a.severity && a.priority && a.action && a.rationale.trim().length >= 30);
  }
  function completedTotal() { return defects.filter(d => complete(answers[d.id])).length; }
  function elem(tag, className, value) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (value !== undefined) el.textContent = value;
    return el;
  }
  function renderOptionGroup(targetId, groupName, options, selected) {
    const node = $(targetId);
    node.replaceChildren();
    for (const opt of options) {
      const label = elem('label', 'choice');
      const radio = document.createElement('input');
      radio.type = 'radio'; radio.name = groupName; radio.value = opt.value;
      radio.checked = selected === opt.value;
      radio.addEventListener('change', () => {
        answers[defects[active].id][groupName] = opt.value;
        hideScore(); updateCounts(); persist();
      });
      const body = elem('span');
      body.append(elem('strong', '', opt.label), elem('small', '', opt.hint));
      label.append(radio, body);
      node.append(label);
    }
  }
  function renderNav() {
    const nav = $('caseNav');
    nav.replaceChildren();
    defects.forEach((d, index) => {
      const btn = elem('button'); btn.type = 'button';
      btn.setAttribute('aria-current', String(index === active));
      btn.append(elem('strong', '', `${String(index+1).padStart(2,'0')} · ${d.id}`), elem('small', '', d.label), elem('span', `nav-status ${complete(answers[d.id]) ? 'done':''}`, complete(answers[d.id]) ? '✓ Documented' : 'Needs triage'));
      btn.addEventListener('click', () => goTo(index));
      nav.append(btn);
    });
  }
  function updateCounts() {
    const count = completedTotal();
    $('completedCount').textContent = `${count}/${defects.length}`;
    $('readinessStatus').textContent = `${count} of ${defects.length} ready`;
    $('missingSummary').textContent = count === defects.length ? 'All five reports have a documented triage assessment. Ready for review.' : `${defects.length - count} report${defects.length-count === 1 ? '' : 's'} still need severity, priority, action and a rationale (30+ characters).`;
    $('caseState').textContent = complete(answers[defects[active].id]) ? 'Documented' : 'Needs triage';
    $('caseState').classList.toggle('complete', complete(answers[defects[active].id]));
    renderNav();
  }
  function goTo(index) {
    active = Math.max(0, Math.min(defects.length - 1, index));
    renderCase();
    persist();
  }
  function renderCase() {
    const d = defects[active], a = answers[d.id];
    const idValues = {
      caseCounter:`CASE ${String(active+1).padStart(2,'0')} OF ${String(defects.length).padStart(2,'0')}`,
      caseCode:d.id, caseTitle:d.title, caseEnvironment:d.environment, caseReporter:d.reporter,
      caseFrequency:d.frequency, caseDeadline:d.deadline, caseObserved:d.observed,
      caseExpected:d.expected, caseImpact:d.impact
    };
    for (const [id, value] of Object.entries(idValues)) $(id).textContent = value;
    renderOptionGroup('severityOptions', 'severity', severityChoices, a.severity);
    renderOptionGroup('priorityOptions', 'priority', priorityChoices, a.priority);
    renderOptionGroup('actionOptions', 'action', actionChoices, a.action);
    $('caseRationale').value = a.rationale;
    $('characterCount').textContent = `${a.rationale.length} / 1,000 characters`;
    $('previousCase').disabled = active === 0;
    $('nextCase').textContent = active === defects.length - 1 ? 'View review ↓' : 'Next issue →';
    updateCounts();
  }
  function hideScore() {
    if (latestScore !== null) {
      latestScore = null;
      $('reviewResult').hidden = true;
      $('briefStatus').textContent = 'Assessment updated · review pending';
      $('missingSummary').textContent = 'Your draft has changed. Finish triage again to refresh feedback.';
    }
  }

  function assess(d, a) {
    const s = a.severity === d.key.severity ? 6 : 0;
    const p = a.priority === d.key.priority ? 6 : 0;
    const act = a.action === d.key.action ? 5 : 0;
    const length = a.rationale.trim().length >= 30 ? 1 : 0;
    const evidence = d.evidence.test(a.rationale) ? 2 : 0;
    return {score:s+p+act+length+evidence, s, p, act, rationale:length+evidence};
  }
  function friendly(arr, value) {
    return arr.find(x => x.value === value)?.label || value;
  }

  // Stage 2: Save completed Bug Triage reviews to My Progress.
  // The existing draft storage remains independent and unchanged.
  function reviewSessionId() {
    const snapshot = JSON.stringify(defects.map(d => {
      const a = answers[d.id];
      return [d.id, a.severity, a.priority, a.action, a.rationale];
    }));

    let a = 2166136261;
    let b = 5381;

    for (let i = 0; i < snapshot.length; i++) {
      const code = snapshot.charCodeAt(i);
      a = Math.imul(a ^ code, 16777619) >>> 0;
      b = (Math.imul(b, 33) ^ code) >>> 0;
    }

    return `bug-triage-${a.toString(16).padStart(8, '0')}-${b.toString(16).padStart(8, '0')}`;
  }

  function saveReviewToProgress(scored, total) {
    const progressKey = 'practicalQaLab.progress.v1';

    try {
      const raw = localStorage.getItem(progressKey);
      const history = raw === null ? [] : JSON.parse(raw);

      if (!Array.isArray(history)) {
        return 'Unexpected progress format. Existing history was not changed.';
      }

      const id = reviewSessionId();

      if (history.some(item => item && item.id === id)) {
        return 'This assessment is already saved. No duplicate added.';
      }

      // Never discard earlier records to make room for this review.
      if (history.length >= 250) {
        return 'Progress history is full. Export your history before continuing.';
      }

      const session = {
        id,
        type: 'challenge',
        area: 'bugtriage',
        score: total,
        maxScore: 100,
        completedAt: new Date().toISOString(),
        questionScores: scored.map(item => item.grades.score)
      };

      localStorage.setItem(
        progressKey,
        JSON.stringify([session, ...history])
      );

      return '✓ Bug Triage score saved to My Progress.';
    } catch (_) {
      return 'Feedback is ready, but progress could not be saved.';
    }
  }

  function showFeedback() {
    const scored = defects.map(d => ({d, a:answers[d.id], grades:assess(d, answers[d.id])}));
    const sum = scored.reduce((n, x) => n + x.grades.score, 0);
    latestScore = sum;
    $('briefStatus').textContent = 'Triage assessment reviewed';
    $('totalScore').textContent = `${sum}/100`;
    $('scoreFill').style.width = `${sum}%`;
    $('reviewMessage').textContent = sum >= 90 ? 'Strong triage alignment with the fictional release rubric.' : sum >= 65 ? 'Good start. Review the impact, urgency and evidence behind your decisions.' : 'Review the rubric and revisit the reports that need attention.';
    const target = $('feedbackCards'); target.replaceChildren();
    const guide = $('answerGuide'); guide.replaceChildren();
    const answerList = elem('ol');
    for (const item of scored) {
      const {d,a,grades:g} = item;
      const card = elem('article', `feedback-card ${g.score === 20 ? 'good' : 'needs-work'}`);
      card.append(elem('h4', '', `${d.id} · ${d.label}`), elem('strong', '', `${g.score}/20 points`), elem('p', 'points', `Severity ${g.s}/6 · Priority ${g.p}/6 · Action ${g.act}/5 · Evidence explanation ${g.rationale}/3`));
      if (g.score === 20) {
        card.append(elem('p', '', 'Your choices match the training rubric and your explanation refers to case evidence.'));
      } else {
        const improvements = [];
        if (!g.s) improvements.push(`Severity: reassess observed customer harm`);
        if (!g.p) improvements.push(`Priority: consider time sensitivity and verified workaround`);
        if (!g.act) improvements.push(`Action: align the disposition with release risk`);
        if (g.rationale < 3) improvements.push('Explanation: cite specific case evidence, not just a label');
        card.append(elem('p', '', improvements.join(' · ')));
      }
      target.append(card);
      const li = elem('li');
      li.append(elem('strong', '', `${d.id}: ${friendly(severityChoices,d.key.severity)} · ${friendly(priorityChoices,d.key.priority)} · ${friendly(actionChoices,d.key.action)}.`), document.createTextNode(` ${d.reason}`));
      answerList.append(li);
    }
    guide.append(elem('p', '', 'These are suggested decisions under this fictional release policy. Real triage can require additional business evidence and team agreement.'), answerList);
    $('reviewResult').hidden = false;
    $('progressSaveStatus').textContent = saveReviewToProgress(scored, sum);
    $('reviewResult').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'start'});
    $('reviewResult').focus({preventScroll:true});
  }

  $('caseRationale').addEventListener('input', event => {
    answers[defects[active].id].rationale = event.target.value;
    $('characterCount').textContent = `${event.target.value.length} / 1,000 characters`;
    hideScore(); updateCounts(); persist();
  });
  $('previousCase').addEventListener('click', () => {
    goTo(active - 1);
    $('workspace').scrollIntoView({behavior:'auto'});
  });
  $('nextCase').addEventListener('click', () => {
    if (active < defects.length-1) {
      goTo(active + 1);
      $('workspace').scrollIntoView({behavior:'auto'});
    } else {
      $('review').scrollIntoView({behavior:'smooth'});
    }
  });
  $('finishReview').addEventListener('click', () => {
    const missingIndex = defects.findIndex(d => !complete(answers[d.id]));
    if (missingIndex >= 0) {
      goTo(missingIndex);
      $('missingSummary').textContent = `Finish ${defects[missingIndex].id}: select all three options and write at least 30 characters.`;
      $('workspace').scrollIntoView({behavior:'smooth'});
      return;
    }
    showFeedback();
    persist();
  });
  $('resetDraft').addEventListener('click', () => {
    if (!window.confirm('Clear all five triage answers from this browser? This cannot be undone.')) return;
    answers = Object.fromEntries(defects.map(d => [d.id, blankAnswer()]));
    active = 0; latestScore = null;
    $('reviewResult').hidden = true;
    $('briefStatus').textContent = 'Assessment not yet submitted';
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* no storage */ }
    renderCase();
    $('draftStatus').textContent = storageAvailable ? 'Draft cleared' : 'Draft cleared on this page';
    $('workspace').scrollIntoView({behavior:'auto'});
  });

  restoreDraft();
  renderCase();
})();
