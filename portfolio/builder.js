(() => {
  'use strict';

  // A browser-local, opt-in document composer. No storage writes, fetch, or external assets.
  const SOURCES = [
    { id: 'case', title: 'Test Case Writing', key: 'pqa_test_case_lab_stage2_v1',
      records(value) { return value && value.version === 1 && Array.isArray(value.cases) ? value.cases : null; },
      valid(r) { return isString(r.id) && isString(r.scenario) && isString(r.requirement) && isString(r.type) && isString(r.priority) && isString(r.steps) && isString(r.testData) && isString(r.expectedResult) && isString(r.preconditions); },
      label(r) { return `${r.id} · ${r.scenario}`; },
      fields(r) { return [['Requirement', r.requirement], ['Test type', r.type], ['Priority', r.priority], ['Preconditions', r.preconditions], ['Steps', r.steps], ['Test data', r.testData], ['Expected result', r.expectedResult]]; } },
    { id: 'checkout', title: 'Checkout Bug Hunt', key: 'practicalQaLabCheckoutReportsV1',
      records(value) { return Array.isArray(value) ? value : null; },
      valid(r) { return isString(r.id) && isString(r.title) && isString(r.requirement) && isString(r.severity) && isString(r.steps) && isString(r.expected) && isString(r.actual); },
      label(r) { return `${r.title} · ${r.severity}`; },
      fields(r) { return [['Requirement', r.requirement], ['Severity (learner assessment)', r.severity], ['Steps to reproduce', r.steps], ['Expected result', r.expected], ['Actual result', r.actual]]; } },
    { id: 'api', title: 'API Bug Hunt', key: 'pqa_api_bug_hunt_reports_v1',
      records(value) { return value && value.version === 1 && value.format === 'pqa-api-bug-hunt-reports' && Array.isArray(value.reports) ? value.reports : null; },
      valid(r) { return isString(r.id) && isString(r.title) && ['create','patch','delete'].includes(r.scenario) && isString(r.severity) && isString(r.steps) && isString(r.expected) && isString(r.actual); },
      label(r) { return `${r.title} · ${r.severity}`; },
      fields(r) { return [['API scenario', {create:'Create user (POST)',patch:'Update user (PATCH)',delete:'Delete user (DELETE)'}[r.scenario]], ['Severity (learner assessment)', r.severity], ['Steps to reproduce', r.steps], ['Expected result', r.expected], ['Actual result', r.actual]]; } },
    { id: 'sql', title: 'SQL Validation', key: 'practical-qa-sql-validation-reports-v1',
      records(value) { return value && value.version === 1 && Array.isArray(value.reports) ? value.reports : null; },
      valid(r) { return isString(r.id) && isString(r.title) && ['totals','ownership','emails'].includes(r.caseId) && isString(r.query) && isString(r.expected) && isString(r.actual); },
      label(r) { return `${r.title} · SQL investigation`; },
      fields(r) { return [['Investigation', {totals:'Order totals', ownership:'Order ownership',emails:'Customer emails'}[r.caseId]], ['Evidence SQL', r.query], ['Expected result', r.expected], ['Actual result', r.actual]]; } },
    { id: 'progress', title: 'My Progress', key: 'practicalQaLab.progress.v1',
      records(value) { return Array.isArray(value) ? value : null; },
      valid(r) { return isString(r.id) && isString(r.type) && isString(r.area) && Number.isFinite(r.score) && Number.isFinite(r.maxScore) && r.maxScore > 0 && r.score >= 0 && r.score <= r.maxScore && isString(r.completedAt); },
      label(r) { return `${r.area} · ${r.score}/${r.maxScore} · ${dateLabel(r.completedAt)}`; },
      fields(r) { return [['Activity', `${r.type} · ${r.area}`], ['Recorded score', `${r.score}/${r.maxScore}`], ['Completed', dateLabel(r.completedAt)]]; } }
  ];

  const MAX_SELECTION = 40;
  const $ = (id) => document.getElementById(id);
  const picked = new Set();
  let recordsById = new Map();
  let lastHtml = '';
  const isString = (value) => typeof value === 'string';
  const dateLabel = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value || 'Date unavailable') : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function read(source) {
    try {
      const raw = localStorage.getItem(source.key);
      if (raw === null) return { items: [] };
      const collection = source.records(JSON.parse(raw));
      if (!collection || !collection.every(item => item && typeof item === 'object' && !Array.isArray(item) && source.valid(item))) {
        return { error: 'Saved data cannot be recognized. Nothing was changed.' };
      }
      return { items: collection };
    } catch (_) {
      return { error: 'Storage is unavailable or contains unreadable data. Nothing was changed.' };
    }
  }

  function message(text, error = false) {
    $('builderStatus').textContent = text;
    $('builderStatus').classList.toggle('is-error', error);
  }

  function resetPreview() {
    lastHtml = '';
    $('portfolioPreview').hidden = true;
    $('downloadPortfolio').disabled = true;
    $('portfolioPreviewFrame').removeAttribute('srcdoc');
  }

  function renderSelection() {
    recordsById = new Map();
    picked.clear();
    const container = $('portfolioChoices');
    container.replaceChildren();
    for (const source of SOURCES) {
      const block = document.createElement('fieldset');
      block.className = 'builder-source';
      const legend = document.createElement('legend');
      legend.textContent = source.title;
      block.append(legend);
      const result = read(source);
      if (result.error) {
        const error = document.createElement('p');
        error.className = 'builder-error';
        error.textContent = result.error;
        block.append(error);
      } else if (!result.items.length) {
        const none = document.createElement('p');
        none.className = 'builder-empty';
        none.textContent = 'Nothing saved in this browser for this source.';
        block.append(none);
      } else {
        result.items.forEach((record, index) => {
          const id = `${source.id}:${index}`;
          recordsById.set(id, { source, record });
          const label = document.createElement('label');
          label.className = 'builder-choice';
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.value = id;
          checkbox.dataset.evidenceId = id;
          const text = document.createElement('span');
          text.textContent = source.label(record);
          label.append(checkbox, text);
          block.append(label);
        });
      }
      container.append(block);
    }
    updateCount();
    resetPreview();
    message('Choose the items to include. Nothing is selected automatically.');
  }

  function updateCount() {
    $('selectionCount').textContent = `${picked.size} selected (maximum ${MAX_SELECTION})`;
    $('previewPortfolio').disabled = picked.size === 0;
  }

  function chosen() {
    return [...recordsById.entries()]
      .filter(([id]) => picked.has(id))
      .map(([, value]) => value);
  }

  function buildHtml(entries, author, title, summary) {
    const groups = SOURCES.map(source => ({ source, items: entries.filter(entry => entry.source.id === source.id) })).filter(group => group.items.length);
    const sections = groups.map(({source, items}) => `
      <section class="section"><h2>${escape(source.title)} <small>${items.length} selected</small></h2>
      ${items.map(({record}, index) => `<article class="entry">
        <h3>${escape(source.id === 'case' ? record.scenario : source.id === 'progress' ? source.label(record) : record.title)}</h3>
        <p class="record-id">${escape(source.id.toUpperCase())} · ${escape(record.id)} · Item ${index + 1}</p>
        ${source.fields(record).filter(([, value]) => value !== '').map(([name, value]) => `<div class="field"><h4>${escape(name)}</h4><p>${escape(value)}</p></div>`).join('\n')}
      </article>`).join('\n')}
      </section>`).join('\n');
    const today = dateLabel(new Date().toISOString());
    return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} — Practice QA Portfolio</title>
<style>
:root{font-family:Arial,Helvetica,sans-serif;color:#142b3c;background:#f3f6f7}*{box-sizing:border-box}body{margin:0;font-size:15px;line-height:1.5}main{max-width:850px;margin:36px auto;background:#fff;padding:48px;box-shadow:0 10px 32px #102a3e15}.eyebrow{text-transform:uppercase;color:#08795b;font-size:11px;letter-spacing:.15em;font-weight:800}.header{border-bottom:4px solid #08795b;padding-bottom:24px;margin-bottom:28px}h1{font-size:34px;line-height:1.15;margin:10px 0}h2{font-size:22px;border-bottom:1px solid #c5d9dd;padding-bottom:8px;margin-top:36px}h2 small{color:#53697a;font-size:12px;font-weight:400;margin-left:8px}h3{font-size:18px;margin:0 0 4px}h4{color:#36536a;text-transform:uppercase;letter-spacing:.05em;font-size:11px;margin:0 0 3px}.entry{border:1px solid #d8e5e8;border-radius:10px;padding:20px;margin:16px 0;break-inside:avoid}.record-id,.meta,.disclaimer{color:#53697a;font-size:12px}.field{margin-top:14px}.field p{white-space:pre-wrap;overflow-wrap:anywhere;margin:0}.summary{white-space:pre-wrap;overflow-wrap:anywhere}footer{border-top:1px solid #c5d9dd;margin-top:35px;padding-top:16px}.notice{background:#e9f5ef;padding:14px 18px;border-left:4px solid #08795b}@page{size:A4;margin:16mm}@media print{html,body{background:#fff}main{max-width:none;margin:0;padding:0;box-shadow:none}.entry{break-inside:avoid}}@media(max-width:600px){main{margin:0;padding:22px}h1{font-size:27px}}
</style></head><body><main>
<header class="header"><p class="eyebrow">Practical QA Lab · Portfolio &amp; Career Readiness</p><h1>${escape(title)}</h1><p><strong>Prepared by:</strong> ${escape(author)}</p><p class="meta">Generated ${escape(today)} · ${entries.length} selected practice artifacts</p></header>
<section><h2>Portfolio overview</h2><p class="summary">${escape(summary || 'Selected QA practice evidence from the Practical QA Lab learning platform.')}</p><p class="notice"><strong>Practice / guided simulations only.</strong> The artifacts below are learner-written submissions and recorded practice results, not independently verified production defects, client engagements or professional certifications.</p></section>
${sections}
<footer><p class="disclaimer">Created locally from browser-saved Practical QA Lab practice artifacts. No data was uploaded. Review the contents before sharing publicly.</p></footer>
</main></body></html>`;
  }

  function preview() {
    if (!picked.size) { message('Select at least one item first.', true); return; }
    if (picked.size > MAX_SELECTION) { message(`Choose no more than ${MAX_SELECTION} items.`, true); return; }
    // Check that selections still match the currently saved records; never export stale data.
    for (const source of SOURCES) {
      if (![...picked].some(id => id.startsWith(source.id + ':'))) continue;
      const current = read(source);
      if (current.error || !current.items) {
        resetPreview(); message(`${source.title} cannot be read. Refresh the evidence list and try again.`, true); return;
      }
      const previous = [...recordsById.entries()].filter(([id]) => picked.has(id) && id.startsWith(source.id + ':'));
      if (previous.some(([id, entry]) => JSON.stringify(current.items[Number(id.split(':')[1])]) !== JSON.stringify(entry.record))) {
        resetPreview(); message(`${source.title} changed after selection. Refresh the evidence list before exporting.`, true); return;
      }
    }
    const entries = chosen();
    const author = $('portfolioAuthor').value.trim().slice(0, 80) || 'QA Learner';
    const title = $('portfolioTitle').value.trim().slice(0, 120) || 'QA Practice Portfolio';
    const summary = $('portfolioSummary').value.trim().slice(0, 600);
    lastHtml = buildHtml(entries, author, title, summary);
    $('portfolioPreviewFrame').srcdoc = lastHtml;
    $('portfolioPreview').hidden = false;
    $('downloadPortfolio').disabled = false;
    message(`Preview ready: ${entries.length} selected practice item(s). Review the document before downloading.`);
  }

  function download() {
    if (!lastHtml) return;
    let url;
    try {
      const blob = new Blob([lastHtml], {type: 'text/html;charset=utf-8'});
      url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qa-practice-portfolio.html';
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      message('Download prepared. Open the HTML in a browser; use Print → Save as PDF if you want a PDF copy.');
    } catch (_) {
      if (url) URL.revokeObjectURL(url);
      message('The download could not be prepared. Your saved reports have not been changed.', true);
    }
  }

  $('portfolioChoices').addEventListener('change', (event) => {
    const input = event.target.closest('input[data-evidence-id]');
    if (!input) return;
    const id = input.dataset.evidenceId;
    if (input.checked) {
      if (picked.size >= MAX_SELECTION) {
        input.checked = false;
        message(`You can select up to ${MAX_SELECTION} items for one document.`, true);
        return;
      }
      picked.add(id);
    } else picked.delete(id);
    resetPreview();
    updateCount();
    message('Selection updated. Preview to review your portfolio.');
  });
  $('previewPortfolio').addEventListener('click', preview);
  $('downloadPortfolio').addEventListener('click', download);
  $('refreshEvidence').addEventListener('click', renderSelection);
  window.addEventListener('storage', renderSelection);
  for (const id of ['portfolioAuthor', 'portfolioTitle', 'portfolioSummary']) {
    $(id).addEventListener('input', () => { resetPreview(); message('Details changed. Preview again before downloading.'); });
  }
  renderSelection();
})();
