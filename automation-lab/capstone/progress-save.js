(() => {
  'use strict';

  const STORAGE_KEY = 'practicalQaLab.progress.v1';
  const MAX_HISTORY = 250;

  const MISSION_POINTS = [15, 20, 20, 15, 15, 15];
  const DECISION_COUNTS = [3, 4, 4, 3, 3, 3];

  function readScore(element, maximum) {
    if (!element) return null;

    const match = element.textContent
      .trim()
      .match(/^(\d+)\/(\d+)$/);

    if (!match) return null;

    const earned = Number(match[1]);
    const max = Number(match[2]);

    if (
      !Number.isSafeInteger(earned) ||
      max !== maximum ||
      earned < 0 ||
      earned > maximum ||
      earned % 5 !== 0
    ) {
      return null;
    }

    return earned;
  }

  function collectAssessment() {
    const summary = document.getElementById(
      'capstoneSummaryResult'
    );

    const report = document.getElementById(
      'capstoneReportResult'
    );

    if (
      !summary || summary.hidden ||
      !report || report.hidden
    ) {
      return null;
    }

    const scores = [];
    const answerCodes = [];

    for (let index = 0; index < 6; index++) {
      const number = index + 1;
      const prefix = `capstoneM${number}`;

      const form = document.getElementById(
        `${prefix}Form`
      );

      const result = document.getElementById(
        `${prefix}Result`
      );

      const score = document.getElementById(
        `${prefix}Score`
      );

      if (!form || !result || result.hidden) {
        return null;
      }

      const earned = readScore(
        score,
        MISSION_POINTS[index]
      );

      if (earned === null) return null;

      const selections = Array.from(
        form.querySelectorAll('select')
      );

      if (
        selections.length !== DECISION_COUNTS[index]
      ) {
        return null;
      }

      for (const select of selections) {
        // Each assessment decision has one placeholder
        // and three available answer choices.
        if (
          select.options.length !== 4 ||
          select.selectedIndex < 1 ||
          select.selectedIndex > 3 ||
          !select.value
        ) {
          return null;
        }

        answerCodes.push(
          String(select.selectedIndex)
        );
      }

      scores.push(earned);
    }

    if (answerCodes.length !== 20) {
      return null;
    }

    const total = scores.reduce(
      (sum, value) => sum + value,
      0
    );

    const summaryScore = readScore(
      document.getElementById('capstoneSummaryScore'),
      100
    );

    const reportScore = readScore(
      document.getElementById('capstoneReportScore'),
      100
    );

    if (
      summaryScore === null ||
      reportScore === null ||
      summaryScore !== total ||
      reportScore !== total
    ) {
      return null;
    }

    return {
      id: 'automation-capstone-v1-' +
        answerCodes.join(''),
      score: total,
      questionScores: scores
    };
  }

  function save() {
    const assessment = collectAssessment();

    if (!assessment) {
      return { status: 'invalid' };
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      const history = raw === null
        ? []
        : JSON.parse(raw);

      // Preserve the same validation behaviour used
      // by the existing Automation Lab progress helper.
      if (
        !Array.isArray(history) ||
        history.some(item =>
          !item ||
          typeof item !== 'object' ||
          typeof item.id !== 'string'
        )
      ) {
        return { status: 'unavailable' };
      }

      if (
        history.some(item =>
          item.id === assessment.id
        )
      ) {
        return {
          status: 'duplicate',
          id: assessment.id,
          score: assessment.score
        };
      }

      const session = {
        id: assessment.id,
        type: 'practice',
        area: 'automation',
        score: assessment.score,
        maxScore: 100,
        completedAt: new Date().toISOString(),
        questionScores: [
          ...assessment.questionScores
        ]
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          [session, ...history].slice(0, MAX_HISTORY)
        )
      );

      return {
        status: 'saved',
        id: assessment.id,
        score: assessment.score
      };

    } catch (_) {
      return { status: 'unavailable' };
    }
  }

  window.ShopFlowCapstoneProgress =
    Object.freeze({ save });
})();
