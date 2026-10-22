(() => {
  'use strict';

  const STORAGE_KEY = 'practicalQaLab.progress.v1';
  const MAX_HISTORY = 250;

  const ANSWER_CODES = Object.freeze({
    correct: 'c',
    wrong1: '1',
    wrong2: '2'
  });

  function save(moduleNumber, stages, choices) {
    if (!Number.isInteger(moduleNumber) ||
        moduleNumber < 1 || moduleNumber > 6 ||
        !Array.isArray(stages) || stages.length !== 4 ||
        !choices || typeof choices !== 'object') {
      return { status: 'invalid' };
    }

    const seen = new Set();
    const codes = [];
    const questionScores = [];

    for (const stage of stages) {
      if (!stage ||
          typeof stage.id !== 'string' ||
          !/^[a-z][a-z0-9]*$/i.test(stage.id) ||
          seen.has(stage.id) ||
          !Number.isInteger(stage.points) ||
          stage.points <= 0 ||
          !Object.prototype.hasOwnProperty.call(
            ANSWER_CODES, choices[stage.id]
          )) {
        return { status: 'invalid' };
      }

      seen.add(stage.id);
      codes.push(ANSWER_CODES[choices[stage.id]]);

      questionScores.push(
        choices[stage.id] === 'correct' ? stage.points : 0
      );
    }

    const maxScore = stages.reduce(
      (sum, stage) => sum + stage.points, 0
    );

    if (maxScore !== 100) {
      return { status: 'invalid' };
    }

    const score = questionScores.reduce(
      (sum, points) => sum + points, 0
    );

    // Module and answer combination survive backup/restore.
    const id = `automation-m${moduleNumber}-${codes.join('')}`;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const history = raw === null ? [] : JSON.parse(raw);

      // Never replace damaged or unexpected existing history.
      if (!Array.isArray(history) ||
          history.some(item =>
            !item ||
            typeof item !== 'object' ||
            typeof item.id !== 'string'
          )) {
        return { status: 'unavailable' };
      }

      if (history.some(item => item.id === id)) {
        return { status: 'duplicate', id, score };
      }

      const session = {
        id,
        type: 'practice',
        area: 'automation',
        score,
        maxScore,
        completedAt: new Date().toISOString(),
        questionScores
      };

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          [session, ...history].slice(0, MAX_HISTORY)
        )
      );

      return { status: 'saved', id, score };
    } catch (_) {
      return { status: 'unavailable' };
    }
  }

  window.AutomationLabProgress = Object.freeze({ save });
})();
