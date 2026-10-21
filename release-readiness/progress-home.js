// Stage 7 Part 2: safely register Release Readiness with the existing My Progress dashboard.
// This small helper intentionally does not replace the homepage's main script.js.
(() => {
  'use strict';
  if (typeof PROGRESS_AREAS === 'undefined' || !Array.isArray(PROGRESS_AREAS)) {
    console.warn('Release Readiness: My Progress registration was not available.');
    return;
  }
  if (!PROGRESS_AREAS.some(area => area.type === 'challenge' && area.key === 'releasereadiness')) {
    PROGRESS_AREAS.push({
      type: 'challenge',
      key: 'releasereadiness',
      title: 'Release Readiness Challenge'
    });
  }
})();
