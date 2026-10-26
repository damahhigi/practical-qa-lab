(() => {
  'use strict';

  const missions = [
  {
    "number": 1,
    "title": "Test Strategy & Smoke Coverage",
    "maximum": 15,
    "recommendation": "Revisit smoke coverage, checkout validation and defect escalation."
  },
  {
    "number": 2,
    "title": "UI Locators & Interactions",
    "maximum": 20,
    "recommendation": "Practise reliable locators, cart interactions and subtotal checks."
  },
  {
    "number": 3,
    "title": "Assertions & State Validation",
    "maximum": 20,
    "recommendation": "Improve assertions for product details, input values and calculated totals."
  },
  {
    "number": 4,
    "title": "Negative & Boundary Testing",
    "maximum": 15,
    "recommendation": "Practise valid boundaries, rejected cart updates and invalid email cases."
  },
  {
    "number": 5,
    "title": "Debugging Flaky Tests",
    "maximum": 15,
    "recommendation": "Review auto-retrying assertions, stable locators and isolated test data."
  },
  {
    "number": 6,
    "title": "API Contract Validation",
    "maximum": 15,
    "recommendation": "Practise GET requests, response contracts and missing-resource handling."
  }
];
  const criteria = [
  {
    "id": "AC-01",
    "requirement": "Display the correct product"
  },
  {
    "id": "AC-02",
    "requirement": "Calculate the cart total"
  },
  {
    "id": "AC-03",
    "requirement": "Enforce stock boundaries"
  },
  {
    "id": "AC-04",
    "requirement": "Validate checkout email"
  },
  {
    "id": "AC-05",
    "requirement": "Validate product API response"
  },
  {
    "id": "AC-06",
    "requirement": "Handle a missing product"
  },
  {
    "id": "AC-07",
    "requirement": "Ensure reliable automation"
  }
];

  const generate = document.getElementById(
    'capstoneReportGenerate'
  );

  if (!generate) return;

  const download = document.getElementById(
    'capstoneReportDownload'
  );

  const status = document.getElementById(
    'capstoneReportStatus'
  );

  const result = document.getElementById(
    'capstoneReportResult'
  );

  const scoreDisplay = document.getElementById(
    'capstoneReportScore'
  );

  const breakdown = document.getElementById(
    'capstoneReportBreakdown'
  );

  const strengths = document.getElementById(
    'capstoneReportStrengths'
  );

  const improvements = document.getElementById(
    'capstoneReportImprovements'
  );

  const coverage = document.getElementById(
    'capstoneReportCoverage'
  );

  const readiness = document.getElementById(
    'capstoneReportReadiness'
  );

  const summaryResult = document.getElementById(
    'capstoneSummaryResult'
  );

  const summaryScore = document.getElementById(
    'capstoneSummaryScore'
  );

  const summaryBreakdown = document.getElementById(
    'capstoneSummaryBreakdown'
  );

  let downloadableText = '';

  const releaseAdvice =
    'Release readiness: UNDETERMINED. This guided ' +
    'exercise does not execute tests against a live ' +
    'ShopFlow application or API. Before approving a ' +
    'real release, execute UI and API test suites, ' +
    'capture evidence, investigate defects, retest ' +
    'fixes and assess remaining risk.';

  function addItem(list, content) {
    const item = document.createElement('li');
    item.textContent = content;
    list.appendChild(item);
  }

  function invalidateReport() {
    result.hidden = true;
    downloadableText = '';

    status.textContent =
      'The assessment may have changed. ' +
      'Recalculate your combined score, then ' +
      'generate a new report.';
  }

  for (const mission of missions) {
    const prefix = `capstoneM${mission.number}`;

    const form = document.getElementById(
      `${prefix}Form`
    );

    const reset = document.getElementById(
      `${prefix}Reset`
    );

    if (form) {
      form.addEventListener('change', invalidateReport);
      form.addEventListener('submit', invalidateReport);
    }

    if (reset) {
      reset.addEventListener('click', invalidateReport);
    }
  }

  const recalculate = document.getElementById(
    'capstoneSummaryReview'
  );

  if (recalculate) {
    recalculate.addEventListener(
      'click',
      invalidateReport
    );
  }

  function readScores() {
    if (
      !summaryResult ||
      summaryResult.hidden ||
      !summaryScore
    ) {
      return null;
    }

    const rows = summaryBreakdown.querySelectorAll('li');

    if (rows.length !== missions.length) {
      return null;
    }

    const details = [];
    let total = 0;

    for (const [index, mission] of missions.entries()) {
      const prefix = `capstoneM${mission.number}`;

      const missionResult = document.getElementById(
        `${prefix}Result`
      );

      const missionScore = document.getElementById(
        `${prefix}Score`
      );

      if (
        !missionResult ||
        missionResult.hidden ||
        !missionScore
      ) {
        return null;
      }

      const match = missionScore.textContent
        .trim()
        .match(/^(\d+)\/(\d+)$/);

      if (!match) return null;

      const earned = Number(match[1]);
      const maximum = Number(match[2]);

      if (
        !Number.isSafeInteger(earned) ||
        maximum !== mission.maximum ||
        earned < 0 ||
        earned > maximum ||
        earned % 5 !== 0
      ) {
        return null;
      }

      const shownPoints = rows[index]
        .querySelector('strong');

      if (
        !shownPoints ||
        shownPoints.textContent.trim() !==
          `${earned}/${maximum}`
      ) {
        return null;
      }

      details.push({ ...mission, earned });
      total += earned;
    }

    if (summaryScore.textContent.trim() !== `${total}/100`) {
      return null;
    }

    return { total, details };
  }

  generate.addEventListener('click', () => {
    result.hidden = true;
    downloadableText = '';

    const data = readScores();

    if (!data) {
      status.textContent =
        'Review all six missions and calculate your ' +
        'combined Capstone score before generating ' +
        'the assessment report.';
      return;
    }

    breakdown.replaceChildren();
    strengths.replaceChildren();
    improvements.replaceChildren();
    coverage.replaceChildren();

    const strongAreas = [];
    const priorityAreas = [];

    scoreDisplay.textContent = `${data.total}/100`;

    for (const mission of data.details) {
      addItem(
        breakdown,
        `Mission ${mission.number}: ${mission.title} — ` +
        `${mission.earned}/${mission.maximum}`
      );

      if (mission.earned === mission.maximum) {
        const description =
          `${mission.title}: full marks in the ` +
          'guided decision exercises.';

        addItem(strengths, description);
        strongAreas.push(description);
      } else {
        const description =
          `${mission.title} (${mission.earned}/` +
          `${mission.maximum}): ` +
          mission.recommendation;

        addItem(improvements, description);
        priorityAreas.push(description);
      }
    }

    if (strongAreas.length === 0) {
      const message =
        'No mission achieved full marks yet. ' +
        'Review feedback and repeat the exercises.';

      addItem(strengths, message);
      strongAreas.push(message);
    }

    if (priorityAreas.length === 0) {
      const message =
        'No gaps were identified by the guided rubric. ' +
        'Next, implement and execute real tests ' +
        'to validate these skills.';

      addItem(improvements, message);
      priorityAreas.push(message);
    }

    for (const criterion of criteria) {
      addItem(
        coverage,
        `${criterion.id}: ${criterion.requirement} — ` +
        'planned scenario; not executed.'
      );
    }

    readiness.textContent = releaseAdvice;

    const textLines = [
      'SHOPFLOW — GUIDED QA ASSESSMENT REPORT',
      'Practical QA Lab v1.5',
      '',
      'ASSESSMENT METHOD',
      'Guided simulation. No live UI or API tests executed.',
      '',
      'COMBINED SCORE',
      `${data.total}/100`,
      '',
      'MISSION PERFORMANCE',
      ...data.details.map(mission =>
        `Mission ${mission.number}: ${mission.title} — ` +
        `${mission.earned}/${mission.maximum}`
      ),
      '',
      'ASSESSMENT STRENGTHS',
      ...strongAreas.map(item => '- ' + item),
      '',
      'DEVELOPMENT PRIORITIES',
      ...priorityAreas.map(item => '- ' + item),
      '',
      'ACCEPTANCE CRITERIA — NOT EXECUTED',
      ...criteria.map(criterion =>
        `${criterion.id}: ${criterion.requirement} — ` +
        'planned only; not executed.'
      ),
      '',
      'RELEASE-READINESS RECOMMENDATION',
      releaseAdvice,
      '',
      'DISCLAIMER',
      'This report describes educational assessment ' +
      'performance, not verified software quality.'
    ];

    downloadableText = textLines.join('\n') + '\n';

    result.hidden = false;

    status.textContent =
      'Assessment report generated. ' +
      'You can download your practice report.';
  });

  download.addEventListener('click', () => {
    if (
      result.hidden ||
      !downloadableText
    ) return;

    const blob = new Blob(
      [downloadableText],
      { type: 'text/plain;charset=utf-8' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'shopflow-guided-qa-assessment.txt';

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
