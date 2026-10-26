(() => {
  'use strict';

  const button = document.getElementById(
    'capstoneProgressSave'
  );

  const status = document.getElementById(
    'capstoneProgressStatus'
  );

  if (!button || !status) return;

  button.addEventListener('click', () => {
    const helper = window.ShopFlowCapstoneProgress;

    const outcome = (
      helper &&
      typeof helper.save === 'function'
    )
      ? helper.save()
      : { status: 'unavailable' };

    const messages = {
      saved:
        'Saved successfully! Your ShopFlow Capstone ' +
        'assessment is now recorded in My Progress.',

      duplicate:
        'This exact assessment is already saved in ' +
        'My Progress. No duplicate was created.',

      invalid:
        'This assessment is not ready to save. ' +
        'Review all six missions, calculate the ' +
        'combined score, and generate the report.',

      unavailable:
        'Unable to save safely. Existing progress ' +
        'has not been replaced. Check browser storage ' +
        'availability or existing progress data.'
    };

    status.textContent =
      messages[outcome.status] ||
      messages.unavailable;
  });

  function markAssessmentChanged() {
    status.textContent =
      'Assessment changed. Review your answers, ' +
      'recalculate the score, and generate an updated ' +
      'report before saving another attempt.';
  }

  for (let number = 1; number <= 6; number++) {
    const prefix = `capstoneM${number}`;

    const form = document.getElementById(
      `${prefix}Form`
    );

    const reset = document.getElementById(
      `${prefix}Reset`
    );

    if (form) {
      form.addEventListener(
        'change',
        markAssessmentChanged
      );

      form.addEventListener(
        'submit',
        markAssessmentChanged
      );
    }

    if (reset) {
      reset.addEventListener(
        'click',
        markAssessmentChanged
      );
    }
  }

  const summary = document.getElementById(
    'capstoneSummaryReview'
  );

  if (summary) {
    summary.addEventListener(
      'click',
      markAssessmentChanged
    );
  }

  const report = document.getElementById(
    'capstoneReportGenerate'
  );

  if (report) {
    report.addEventListener('click', () => {
      status.textContent =
        'If the updated report is complete, ' +
        'you can save this assessment to My Progress.';
    });
  }
})();
