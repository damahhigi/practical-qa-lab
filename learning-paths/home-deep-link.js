(() => {
  'use strict';
  // Stage 6 Part 2: read a narrowly scoped direct activity URL on the homepage.
  // Does not read, save, or modify user progress.
  const params = new URLSearchParams(window.location.search);
  const practice = params.get('qa-practice');
  const interview = params.get('qa-interview');

  document.addEventListener('DOMContentLoaded', () => {
    if (practice && ['manual', 'api', 'sql'].includes(practice)) {
      if (typeof window.startPractice === 'function') {
        window.startPractice(practice);
        document.getElementById('practice')?.scrollIntoView({ block: 'start' });
      }
    } else if (interview && ['junior', 'mid', 'senior'].includes(interview)) {
      if (typeof window.showInterviewSetup === 'function' &&
          typeof window.selectInterviewLevel === 'function') {
        window.showInterviewSetup();
        window.selectInterviewLevel(interview);
        document.getElementById('interview')?.scrollIntoView({ block: 'start' });
      }
    }
  });
})();
