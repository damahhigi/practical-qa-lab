(() => {
  'use strict';

  const missions = [
  {
    "number": 1,
    "title": "Test Strategy & Smoke Coverage",
    "max": 15
  },
  {
    "number": 2,
    "title": "UI Locators & Interactions",
    "max": 20
  },
  {
    "number": 3,
    "title": "Assertions & State Validation",
    "max": 20
  },
  {
    "number": 4,
    "title": "Negative & Boundary Testing",
    "max": 15
  },
  {
    "number": 5,
    "title": "Debugging Flaky Tests",
    "max": 15
  },
  {
    "number": 6,
    "title": "API Contract Validation",
    "max": 15
  }
];

  const trigger = document.getElementById(
    'capstoneSummaryReview'
  );

  if (!trigger) return;

  const status = document.getElementById(
    'capstoneSummaryStatus'
  );

  const result = document.getElementById(
    'capstoneSummaryResult'
  );

  const totalScore = document.getElementById(
    'capstoneSummaryScore'
  );

  const breakdown = document.getElementById(
    'capstoneSummaryBreakdown'
  );

  function invalidateSummary() {
    result.hidden = true;
    totalScore.textContent = '0/100';
    breakdown.replaceChildren();

    status.textContent =
      'Assessment selections or reviews changed. ' +
      'Review all six missions before recalculating.';
  }

  // Any changed answer, new review, or cleared draft
  // makes the previous combined score outdated.
  for (const mission of missions) {
    const prefix = `capstoneM${mission.number}`;

    const form = document.getElementById(
      `${prefix}Form`
    );

    const reset = document.getElementById(
      `${prefix}Reset`
    );

    if (form) {
      form.addEventListener('change', invalidateSummary);
      form.addEventListener('submit', invalidateSummary);
    }

    if (reset) {
      reset.addEventListener('click', invalidateSummary);
    }
  }

  trigger.addEventListener('click', () => {
    result.hidden = true;
    breakdown.replaceChildren();

    const pending = [];
    const reviewed = [];

    for (const mission of missions) {
      const prefix = `capstoneM${mission.number}`;

      const missionResult = document.getElementById(
        `${prefix}Result`
      );

      const missionScore = document.getElementById(
        `${prefix}Score`
      );

      if (
        !missionResult ||
        !missionScore ||
        missionResult.hidden
      ) {
        pending.push(mission.number);
        continue;
      }

      const match = missionScore.textContent
        .trim()
        .match(/^(\d+)\/(\d+)$/);

      if (!match) {
        status.textContent =
          'A mission score could not be read. ' +
          'Review the mission again.';
        return;
      }

      const earned = Number(match[1]);
      const maximum = Number(match[2]);

      if (
        !Number.isSafeInteger(earned) ||
        maximum !== mission.max ||
        earned < 0 ||
        earned > maximum ||
        earned % 5 !== 0
      ) {
        status.textContent =
          'A mission score is invalid. ' +
          'Review the mission again.';
        return;
      }

      reviewed.push({
        ...mission,
        earned
      });
    }

    if (pending.length > 0) {
      status.textContent =
        'Review these missions first: ' +
        pending.map(number => `Mission ${number}`).join(', ') +
        '.';
      return;
    }

    const earnedTotal = reviewed.reduce(
      (sum, mission) => sum + mission.earned,
      0
    );

    const maximumTotal = reviewed.reduce(
      (sum, mission) => sum + mission.max,
      0
    );

    if (maximumTotal !== 100) {
      status.textContent =
        'The mission point totals are inconsistent.';
      return;
    }

    for (const mission of reviewed) {
      const item = document.createElement('li');
      const label = document.createElement('span');
      const points = document.createElement('strong');

      label.textContent =
        `Mission ${mission.number}: ${mission.title}`;

      points.textContent =
        `${mission.earned}/${mission.max}`;

      item.append(label, points);
      breakdown.appendChild(item);
    }

    totalScore.textContent = `${earnedTotal}/100`;
    result.hidden = false;

    status.textContent =
      'All six missions reviewed. ' +
      'Your combined assessment score is ready.';
  });
})();
