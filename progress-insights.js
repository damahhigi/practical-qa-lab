(() => {
  'use strict';

  // v1.3: Read-only score comparison for repeat attempts.
  // Never modifies sessions or browser storage.
  window.renderProgressInsights = function(sessions, areas) {
    const target = document.getElementById('progressTrendSummary');

    if (!target || !Array.isArray(sessions) || !Array.isArray(areas)) return;

    const timeOf = item => {
      const value = Date.parse(item.completedAt);
      return Number.isFinite(value) ? value : 0;
    };

    const comparisons = [];

    for (const area of areas) {
      const attempts = sessions
        .map((item, index) => ({ item, index }))
        .filter(({ item }) =>
          item.type === area.type && item.area === area.key
        )
        .sort((a, b) =>
          timeOf(a.item) - timeOf(b.item) || b.index - a.index
        );

      if (attempts.length < 2) continue;

      const previous = attempts[attempts.length - 2].item;
      const latest = attempts[attempts.length - 1].item;

      const previousScore = Math.round(
        100 * previous.score / previous.maxScore
      );
      const latestScore = Math.round(
        100 * latest.score / latest.maxScore
      );

      comparisons.push({
        title: area.title,
        previousScore,
        latestScore,
        difference: latestScore - previousScore,
        time: timeOf(latest)
      });
    }

    if (!comparisons.length) {
      target.textContent =
        'Score changes: Complete the same practice area at least twice to compare attempts.';
      return;
    }

    comparisons.sort((a, b) => b.time - a.time);

    const result = comparisons[0];
    const change = result.difference > 0
      ? `up ${result.difference} percentage points`
      : result.difference < 0
        ? `down ${Math.abs(result.difference)} percentage points`
        : 'no change';

    target.textContent =
      `Recent score comparison · ${result.title}: ` +
      `${result.previousScore}% → ${result.latestScore}% (${change}). ` +
      'Scores can vary with exercise difficulty.';
  };
})();
