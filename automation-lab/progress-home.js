(() => {
  'use strict';

  // Register the six-module Automation Lab as one progress area.
  // Do not replace or modify saved learner sessions.
  if (typeof PROGRESS_AREAS === 'undefined' ||
      !Array.isArray(PROGRESS_AREAS)) {
    console.warn(
      'Automation Lab: My Progress registration unavailable.'
    );
    return;
  }

  if (!PROGRESS_AREAS.some(
    area => area.type === 'practice' &&
            area.key === 'automation'
  )) {
    PROGRESS_AREAS.push({
      type: 'practice',
      key: 'automation',
      title: 'Test Automation Lab'
    });
  }
})();
