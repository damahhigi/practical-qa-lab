(() => {
  'use strict';

  const SOURCES = [
    {
      name: 'case', key: 'pqa_test_case_lab_stage2_v1',
      read(value) {
        return value && value.version === 1 && Array.isArray(value.cases)
          && value.cases.every(item => item && typeof item.id === 'string'
            && typeof item.scenario === 'string') ? value.cases.length : null;
      }
    },
    {
      name: 'checkout', key: 'practicalQaLabCheckoutReportsV1',
      read(value) {
        return Array.isArray(value) && value.every(item => item
          && typeof item.id === 'string' && typeof item.title === 'string')
          ? value.length : null;
      }
    },
    {
      name: 'api', key: 'pqa_api_bug_hunt_reports_v1',
      read(value) {
        return value && value.version === 1 && value.format === 'pqa-api-bug-hunt-reports'
          && Array.isArray(value.reports) && value.reports.every(item => item
            && typeof item.id === 'string' && typeof item.title === 'string')
          ? value.reports.length : null;
      }
    },
    {
      name: 'sql', key: 'practical-qa-sql-validation-reports-v1',
      read(value) {
        return value && value.version === 1 && Array.isArray(value.reports)
          && value.reports.every(item => item && typeof item.id === 'string'
            && typeof item.title === 'string') ? value.reports.length : null;
      }
    },
    {
      name: 'progress', key: 'practicalQaLab.progress.v1',
      read(value) {
        return Array.isArray(value) && value.every(item => item && typeof item.id === 'string'
          && typeof item.type === 'string' && typeof item.area === 'string')
          ? value.length : null;
      }
    }
  ];

  function readSource(source) {
    try {
      const raw = window.localStorage.getItem(source.key);
      if (raw === null) return { count: 0, note: 'No saved items on this website origin.' };
      const count = source.read(JSON.parse(raw));
      if (count === null) return {
        count: null,
        note: 'Saved data could not be recognized. Open the original lab; nothing was changed.'
      };
      return {
        count,
        note: count === 0 ? 'No saved items on this website origin.' : 'Found saved items in this browser.'
      };
    } catch (_) {
      return {
        count: null,
        note: 'Browser storage is unavailable or contains unreadable data. Nothing was changed.'
      };
    }
  }

  function refreshEvidence() {
    let available = 0;
    let unreadable = 0;
    SOURCES.forEach(source => {
      const result = readSource(source);
      document.getElementById(`${source.name}Count`).textContent =
        result.count === null ? '—' : String(result.count);
      document.getElementById(`${source.name}Note`).textContent = result.note;
      if (result.count === null) unreadable += 1;
      else available += 1;
    });
    const status = document.getElementById('inventoryStatus');
    status.textContent = unreadable
      ? `${available} of 5 sources checked; ${unreadable} unavailable or unrecognized. No data was changed.`
      : '5 of 5 sources checked. Read-only scan complete.';
  }

  document.getElementById('refreshEvidence').addEventListener('click', refreshEvidence);
  window.addEventListener('storage', refreshEvidence);
  refreshEvidence();
})();
