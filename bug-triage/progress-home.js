(() => {
  'use strict';

  // Register Bug Triage without replacing the homepage progress system.
  if (typeof PROGRESS_AREAS === 'undefined' ||
      !Array.isArray(PROGRESS_AREAS)) {
    console.warn('Bug Triage: My Progress registration unavailable.');
    return;
  }

  if (!PROGRESS_AREAS.some(
    area => area.type === 'challenge' && area.key === 'bugtriage'
  )) {
    PROGRESS_AREAS.push({
      type: 'challenge',
      key: 'bugtriage',
      title: 'Bug Triage & Defect Management Lab'
    });
  }
})();
