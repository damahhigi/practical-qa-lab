/*
  Practical QA Lab — Checkout Bug Hunt · Stage 5 progress integration.
  This is a purpose-built testing exercise, not a production checkout.
  The learner-facing application intentionally has incorrect behaviour.
  Do not use this logic to process payments or real orders.
*/
"use strict";

const PRODUCTS = Object.freeze({
  notebook: { id: "notebook", name: "Notebook", price: 1000 },
  mouse: { id: "mouse", name: "Wireless Mouse", price: 1500 },
  headphones: { id: "headphones", name: "Headphones", price: 2500 }
});

const state = {
  cart: {},
  subtotalSnapshot: 0,
  discountApplied: false,
  lastOrderNumber: 0
};

const $ = id => document.getElementById(id);
const formatKES = value => `KES ${Math.round(value).toLocaleString("en-KE")}`;
const cartEntries = () => Object.values(state.cart);
const cartQuantity = () => cartEntries().reduce((sum, item) => sum + item.quantity, 0);

function recalculateCartSnapshot() {
  state.subtotalSnapshot = cartEntries().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculatedTotals() {
  const subtotal = state.subtotalSnapshot;
  const discount = state.discountApplied ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal > 0 && subtotal <= 3000 ? 250 : 0;
  const total = subtotal + shipping;
  return { subtotal, discount, shipping, total };
}

function notify(message) {
  $("announcement").textContent = message;
}

function hideConfirmation() {
  $("orderConfirmation").hidden = true;
  $("orderConfirmation").replaceChildren();
}

function setDiscountMessage(text, type = "") {
  const element = $("discountMessage");
  element.className = `discount-message${type ? ` ${type}` : ""}`;
  element.textContent = text;
}

function addToCart(id) {
  const product = PRODUCTS[id];
  if (!product) return;
  const current = state.cart[id];
  if (current && current.quantity >= 5) return;
  if (current) current.quantity++;
  else state.cart[id] = { ...product, quantity: 1 };
  recalculateCartSnapshot();
  hideConfirmation();
  render();
  notify(`${product.name} added to test cart.`);
}

function changeQuantity(id, amount) {
  const item = state.cart[id];
  if (!item) return;
  const updated = item.quantity + amount;
  if (updated < 1 || updated > 5) return;
  item.quantity = updated;
  hideConfirmation();
  render();
  notify(`${item.name} quantity changed to ${updated}.`);
}

function removeProduct(id) {
  const item = state.cart[id];
  if (!item) return;
  delete state.cart[id];
  recalculateCartSnapshot();
  if (!cartQuantity()) {
    state.discountApplied = false;
    $("discountCode").value = "";
    setDiscountMessage("Try any relevant code from the requirements.");
  }
  hideConfirmation();
  render();
  notify(`${item.name} removed from test cart.`);
}

function resetShop() {
  state.cart = {};
  state.subtotalSnapshot = 0;
  state.discountApplied = false;
  $("discountCode").value = "";
  setDiscountMessage("Try any relevant code from the requirements.");
  hideConfirmation();
  render();
  notify("The test shop has been reset.");
}

function applyPromotion(event) {
  event.preventDefault();
  if (!cartQuantity()) {
    setDiscountMessage("Add an item to your cart first.", "error");
    return;
  }
  const input = $("discountCode").value.trim().toUpperCase();
  if (input === "SAVE10") {
    state.discountApplied = true;
    setDiscountMessage("Code SAVE10 applied successfully.", "success");
  } else {
    state.discountApplied = false;
    setDiscountMessage("That promotional code is not recognised.", "error");
  }
  hideConfirmation();
  renderTotals();
}

function placeTestOrder() {
  if (!cartQuantity()) return;
  const { total } = calculatedTotals();
  const receipt = $("orderConfirmation");
  state.lastOrderNumber++;
  const orderLabel = `TEST-${String(state.lastOrderNumber).padStart(3, "0")}`;
  const heading = document.createElement("strong");
  heading.textContent = `Test order ${orderLabel} confirmed`;
  const detail = document.createElement("p");
  detail.textContent = `Order total: ${formatKES(total)}. No payment was taken. Compare this receipt with REQ-07.`;
  receipt.replaceChildren(heading, detail);
  receipt.hidden = false;
  notify(`Simulated order ${orderLabel} created.`);
}

function makeButton(label, action, id, disabled, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = id;
  button.className = extraClass;
  button.disabled = disabled;
  return button;
}

function renderCart() {
  const container = $("cartItems");
  const entries = cartEntries();
  $("cartCount").textContent = `${cartQuantity()} ${cartQuantity() === 1 ? "item" : "items"}`;
  if (!entries.length) {
    container.innerHTML = '<div class="empty-cart"><span aria-hidden="true">🛒</span><strong>Your cart is empty</strong><p>Add a product to begin testing.</p></div>';
    return;
  }
  container.replaceChildren();
  entries.forEach(item => {
    const row = document.createElement("div");
    row.className = "cart-item";
    const left = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = item.name;
    const unit = document.createElement("div");
    unit.className = "item-unit";
    unit.textContent = `${formatKES(item.price)} each`;
    const actions = document.createElement("div");
    actions.className = "item-actions";
    const stepper = document.createElement("div");
    stepper.className = "quantity-box";
    stepper.setAttribute("aria-label", `${item.name} quantity controls`);
    const minus = makeButton("−", "decrease", item.id, item.quantity === 1);
    minus.setAttribute("aria-label", `Decrease ${item.name} quantity`);
    const number = document.createElement("span");
    number.textContent = String(item.quantity);
    const plus = makeButton("+", "increase", item.id, item.quantity === 5);
    plus.setAttribute("aria-label", `Increase ${item.name} quantity`);
    stepper.append(minus, number, plus);
    const remove = makeButton("Remove", "remove", item.id, false, "remove-button");
    remove.setAttribute("aria-label", `Remove ${item.name} from cart`);
    actions.append(stepper, remove);
    left.append(name, unit, actions);
    const lineTotal = document.createElement("strong");
    lineTotal.className = "item-price";
    lineTotal.textContent = formatKES(item.price * item.quantity);
    row.append(left, lineTotal);
    container.append(row);
  });
}

function renderTotals() {
  const totals = calculatedTotals();
  $("subtotal").textContent = formatKES(totals.subtotal);
  $("discount").textContent = `${totals.discount ? "−" : ""}${formatKES(totals.discount)}`;
  $("shipping").textContent = totals.shipping === 0 ? "FREE" : formatKES(totals.shipping);
  $("grandTotal").textContent = formatKES(totals.total);
  $("applyDiscount").disabled = !cartQuantity();
  $("discountCode").disabled = !cartQuantity();
  $("placeOrder").disabled = !cartQuantity();
}

function renderCatalog() {
  document.querySelectorAll("[data-add]").forEach(button => {
    const id = button.dataset.add;
    const quantity = state.cart[id]?.quantity || 0;
    button.disabled = quantity >= 5;
    button.textContent = quantity >= 5 ? "Maximum 5 added" : quantity > 0 ? "Add another" : "Add to cart";
  });
}

function render() {
  renderCart();
  renderTotals();
  renderCatalog();
}


// Reports are saved separately. Only completed challenge SCORES enter the v0.6 progress backup.
const REPORT_STORAGE_KEY = "practicalQaLabCheckoutReportsV1";
const MAX_REPORTS = 12;
const REPORT_REQUIREMENTS = new Set(["REQ-01", "REQ-02", "REQ-03", "REQ-04", "REQ-05", "REQ-06", "REQ-07"]);
const REPORT_SEVERITIES = new Set(["Critical", "Major", "Minor"]);
let savedBugReports = [];
let editingReportId = null;

function isValidReport(value) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    typeof value.id === "string" && value.id.length > 0 && value.id.length < 100 &&
    typeof value.title === "string" && value.title.length >= 10 && value.title.length <= 140 &&
    REPORT_REQUIREMENTS.has(value.requirement) && REPORT_SEVERITIES.has(value.severity) &&
    typeof value.steps === "string" && value.steps.length >= 15 && value.steps.length <= 2000 &&
    typeof value.expected === "string" && value.expected.length >= 10 && value.expected.length <= 1000 &&
    typeof value.actual === "string" && value.actual.length >= 10 && value.actual.length <= 1000;
}

function loadBugReports() {
  try {
    const value = JSON.parse(localStorage.getItem(REPORT_STORAGE_KEY) || "[]");
    savedBugReports = Array.isArray(value) ? value.filter(isValidReport).slice(0, MAX_REPORTS) : [];
  } catch (error) {
    savedBugReports = [];
    reportMessage("Saved reports couldn't be read from this browser. You can still create a new report.", true);
  }
}

function storeBugReports(reports) {
  try {
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reports));
    savedBugReports = reports;
    invalidateAssessment();
    updateFinishAvailability();
    return true;
  } catch (error) {
    reportMessage("The browser couldn't save this report. Check your storage settings or available space.", true);
    return false;
  }
}

function reportMessage(text, isError = false) {
  const element = $("reportFormMessage");
  element.textContent = text;
  element.classList.toggle("error", isError);
}

function reportField(parent, label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "report-detail";
  const term = document.createElement("dt");
  term.textContent = label;
  const definition = document.createElement("dd");
  definition.textContent = value;
  wrapper.append(term, definition);
  parent.append(wrapper);
}

function renderSavedReports() {
  const container = $("savedReports");
  $("reportCount").textContent = `${savedBugReports.length} ${savedBugReports.length === 1 ? "report" : "reports"}`;
  if (!savedBugReports.length) {
    container.innerHTML = '<div class="empty-reports"><strong>No reports yet</strong><p>Explore the store, then save your first finding using the form.</p></div>';
    return;
  }
  container.replaceChildren();
  savedBugReports.forEach((report, position) => {
    const card = document.createElement("article");
    card.className = "report-card";
    const top = document.createElement("div");
    top.className = "report-card-top";
    const titleArea = document.createElement("div");
    const title = document.createElement("h4");
    title.textContent = `Report ${savedBugReports.length - position}: ${report.title}`;
    const meta = document.createElement("div");
    meta.className = "report-meta";
    meta.textContent = report.requirement;
    titleArea.append(title, meta);
    const severity = document.createElement("span");
    severity.className = `severity-pill severity-${report.severity.toLowerCase()}`;
    severity.textContent = report.severity;
    top.append(titleArea, severity);
    const details = document.createElement("dl");
    reportField(details, "Steps to reproduce", report.steps);
    reportField(details, "Expected result", report.expected);
    reportField(details, "Actual result", report.actual);
    const actions = document.createElement("div");
    actions.className = "report-card-actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit report";
    edit.dataset.editReport = report.id;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-report";
    remove.textContent = "Delete report";
    remove.dataset.deleteReport = report.id;
    actions.append(edit, remove);
    card.append(top, details, actions);
    container.append(card);
  });
}

function resetReportForm(message = "Reports are saved locally. Finish the challenge for feedback.") {
  editingReportId = null;
  $("bugReportForm").reset();
  $("saveReport").textContent = "Save bug report";
  $("form-title").textContent = "New defect report";
  $("cancelReportEdit").hidden = true;
  reportMessage(message);
}

function reportFormValues() {
  return {
    title: $("reportTitle").value.trim(),
    requirement: $("reportRequirement").value,
    severity: $("reportSeverity").value,
    steps: $("reportSteps").value.trim(),
    expected: $("reportExpected").value.trim(),
    actual: $("reportActual").value.trim()
  };
}

function saveReport(event) {
  event.preventDefault();
  const form = $("bugReportForm");
  if (!form.reportValidity()) return;
  const values = reportFormValues();
  if (!editingReportId && savedBugReports.length >= MAX_REPORTS) {
    reportMessage(`This prototype supports up to ${MAX_REPORTS} saved reports. Edit or delete a report to continue.`, true);
    return;
  }
  const current = editingReportId ? savedBugReports.find(report => report.id === editingReportId) : null;
  const report = {
    ...values,
    id: current?.id || `bug-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: current?.createdAt || new Date().toISOString()
  };
  if (!isValidReport(report)) {
    reportMessage("Please complete every field with enough detail before saving.", true);
    return;
  }
  const wasEditing = Boolean(current);
  const nextReports = current
    ? savedBugReports.map(existing => existing.id === current.id ? report : existing)
    : [report, ...savedBugReports];
  if (!storeBugReports(nextReports)) return;
  renderSavedReports();
  resetReportForm(wasEditing ? "Report updated. Finish the challenge again to assess your revised findings." : "Report saved. Finish the challenge when ready for feedback.");
  notify(wasEditing ? "Bug report updated." : "Bug report saved.");
}

function startEditingReport(id) {
  const report = savedBugReports.find(item => item.id === id);
  if (!report) return;
  editingReportId = id;
  $("reportTitle").value = report.title;
  $("reportRequirement").value = report.requirement;
  $("reportSeverity").value = report.severity;
  $("reportSteps").value = report.steps;
  $("reportExpected").value = report.expected;
  $("reportActual").value = report.actual;
  $("saveReport").textContent = "Save changes";
  $("form-title").textContent = "Edit defect report";
  $("cancelReportEdit").hidden = false;
  reportMessage("Editing your saved report. Select Save changes to update it.");
  $("bugReportForm").scrollIntoView({ behavior: "smooth", block: "start" });
  $("reportTitle").focus({ preventScroll: true });
}

function deleteSavedReport(id) {
  const report = savedBugReports.find(item => item.id === id);
  if (!report || !window.confirm(`Delete this saved report?\n\n${report.title}`)) return;
  const nextReports = savedBugReports.filter(item => item.id !== id);
  if (!storeBugReports(nextReports)) return;
  if (editingReportId === id) resetReportForm();
  renderSavedReports();
  reportMessage("The selected report was deleted. Other saved reports remain unchanged.");
  notify("Bug report deleted.");
}

function setupReportForm() {
  loadBugReports();
  renderSavedReports();
  updateFinishAvailability();
  $("finishChallenge").addEventListener("click", finishBugHunt);
  $("bugReportForm").addEventListener("submit", saveReport);
  $("cancelReportEdit").addEventListener("click", () => resetReportForm("Editing cancelled. The saved report was not changed."));
  $("savedReports").addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-report]");
    const remove = event.target.closest("[data-delete-report]");
    if (edit) startEditingReport(edit.dataset.editReport);
    else if (remove) deleteSavedReport(remove.dataset.deleteReport);
  });
}



// Stage 4 — rule-based practice feedback. This is NOT semantic or AI assessment.
// The three known issues are deliberately concealed in the UI until Finish challenge.
const ASSESSMENT_ISSUES = Object.freeze({
  quantity: { label: "Quantity / subtotal mismatch", requirements: new Set(["REQ-02", "REQ-03"]) },
  promo: { label: "Applied promotion / final-total mismatch", requirements: new Set(["REQ-04", "REQ-06"]) },
  shipping: { label: "Free-shipping threshold mismatch", requirements: new Set(["REQ-05"]) }
});

const mismatchPattern = /\b(?:not|no|unchanged|wrong|incorrect|still|remains?|stale|mismatch|fails?|missing|ignored|charged|doesn['’]?t|didn['’]?t|isn['’]?t)\b/i;
function possibleKnownIssue(report) {
  const actions = `${report.title} ${report.steps}`.toLowerCase();
  const all = `${actions} ${report.expected} ${report.actual}`.toLowerCase();
  const actual = report.actual.toLowerCase();
  if (!mismatchPattern.test(actual)) return null;
  if (ASSESSMENT_ISSUES.quantity.requirements.has(report.requirement) &&
    /\b(?:quantit(?:y|ies)|increas\w*|decreas\w*|reduc\w*|lower\w*|plus|minus|increment\w*|decrement\w*|change\w*)\b/i.test(actions) &&
    /\b(?:sub[ -]?totals?|totals?|prices?|amounts?)\b/i.test(all) &&
    /\b(?:sub[ -]?totals?|totals?|prices?|amounts?)\b/i.test(actual)) return "quantity";
  if (ASSESSMENT_ISSUES.promo.requirements.has(report.requirement) &&
    /\b(?:save10|discount\w*|promot\w*|coupon\w*|code)\b/i.test(actions) &&
    /\b(?:totals?|amounts?|charged?|deduct\w*|redu\w*|prices?)\b/i.test(actual)) return "promo";
  if (ASSESSMENT_ISSUES.shipping.requirements.has(report.requirement) &&
    /\b(?:shipping|deliver\w*|fee|charge\w*)\b/i.test(all) &&
    /(?:3[ ,]?000|threshold|exactly|at the limit)/i.test(all) &&
    /\b(?:free|zero|0|no shipping)\b/i.test(report.expected) &&
    /\b(?:shipping|fee|charged?|250|costs?)\b/i.test(actual)) return "shipping";
  return null;
}

function writingChecks(report) {
  const steps = report.steps;
  const data = `${report.title} ${steps}`;
  const markers = steps.match(/^\s*(?:\d+\s*[.)-]|step\s*\d+\s*[:.)-]|[-•])\s*/gim) || [];
  return [
    { pass: report.title.trim().length >= 25, advice: "Make the title specific: what failed and under which condition." },
    { pass: markers.length >= 2, advice: "Number at least two actionable reproduction steps in order." },
    { pass: /\b(?:notebook|mouse|mice|headphones|save10)\b|\bkes\s*\d+|\b(?:quantity|qty)\s*(?:of|from|to|=|:)\s*\d+|\b\d+\s*(?:items?|units?|notebooks?|mice|mouse|headphones?)\b/i.test(data), advice: "Include concrete test data: product, starting/ending quantity, promo code or amount." },
    { pass: /\b(?:should|must|expected|free|discount\w*|updat\w*|recalculat\w*|deduct\w*)\b|\bkes\s*\d+/i.test(report.expected), advice: "State the precise expected behaviour or calculation from the requirement." },
    { pass: mismatchPattern.test(report.actual) || /\bkes\s*\d+/i.test(report.actual), advice: "Record the actual observation, ideally including the displayed amount." }
  ];
}

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
}

function invalidateAssessment() {
  const results = $("assessmentResults");
  const guide = $("answerGuide");
  if (!results || !guide) return;
  results.hidden = true;
  results.replaceChildren();
  guide.hidden = true;
  $("assessmentHint").textContent = savedBugReports.length
    ? "Reports changed. Finish the challenge to review the current findings."
    : "Save at least one bug report to enable feedback.";
}

function updateFinishAvailability() {
  const button = $("finishChallenge");
  if (!button) return;
  button.disabled = savedBugReports.length === 0;
  if (savedBugReports.length > 0 && $("assessmentResults").hidden)
    $("assessmentHint").textContent = `${savedBugReports.length} saved report(s) ready. Feedback appears after you finish.`;
}

/* Stage 5 — Save a completed Bug Hunt as a v1 progress session.
   Reuse the exact schema from the main site (id, type, area, score, maxScore,
   completedAt, questionScores) so old backups still work with no migration.
   Do not include full bug reports in the main progress history/exports.
   The challenge and dashboard must run on the SAME ORIGIN (HTTP localhost or GitHub Pages).
*/
const BUG_HUNT_PROGRESS_KEY = "practicalQaLab.progress.v1";
const BUG_HUNT_MAX_HISTORY = 250;

function savedReportFingerprint() {
  // Stable ID for an unchanged group of reports, including edits.
  // Avoid duplicate score entries when a learner clicks Finish twice or refreshes.
  const sorted = [...savedBugReports].sort((a, b) => a.id.localeCompare(b.id));
  const data = JSON.stringify(sorted.map(report => [
    report.id, report.title, report.requirement, report.severity,
    report.steps, report.expected, report.actual
  ]));
  let a = 2166136261;
  let b = 2246822519;
  for (let i = 0; i < data.length; i++) {
    const value = data.charCodeAt(i);
    a = Math.imul(a ^ value, 16777619);
    b = Math.imul(b ^ value, 3266489917);
  }
  return `checkout-${(a >>> 0).toString(36)}-${(b >>> 0).toString(36)}`;
}

function saveCheckoutChallengeScore(score) {
  try {
    const current = JSON.parse(localStorage.getItem(BUG_HUNT_PROGRESS_KEY) || "[]");
    if (!Array.isArray(current)) return "Progress wasn't saved because existing history is invalid. Export or repair your history first.";
    const id = savedReportFingerprint();
    if (current.some(item => item && item.id === id))
      return "This unchanged set of findings was already saved to My Progress. Edit a report or document a new finding to record another attempt.";

    const record = {
      id, type: "challenge", area: "checkout", score, maxScore: 100,
      completedAt: new Date().toISOString(), questionScores: []
    };
    // Keep only records understood by the main dashboard, avoiding accidental
    // deletion of existing sessions if unrelated data occupies the key.
    const valid = current.every(item => item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.type === "string" &&
      typeof item.area === "string" && Number.isFinite(item.score) &&
      Number.isFinite(item.maxScore) && typeof item.completedAt === "string");
    if (!valid) return "Your existing progress needs attention. No changes were made to its saved history.";
    const recent = [record, ...current].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    localStorage.setItem(BUG_HUNT_PROGRESS_KEY, JSON.stringify(recent.slice(0, BUG_HUNT_MAX_HISTORY)));
    return "✓ Bug Hunt result saved to My Progress. Go back to Practical QA Lab and open View my progress.";
  } catch (error) {
    return "Score shown here, but browser storage couldn't save the progress entry. Use the same website origin and check your browser storage settings.";
  }
}

function finishBugHunt() {
  if (!savedBugReports.length) return;
  const reports = savedBugReports.map(report => ({
    report, issue: possibleKnownIssue(report), checks: writingChecks(report)
  }));
  const bestByIssue = new Map();
  reports.forEach(entry => {
    if (!entry.issue) return;
    const quality = entry.checks.filter(check => check.pass).length;
    const best = bestByIssue.get(entry.issue);
    if (!best || quality > best.checks.filter(check => check.pass).length)
      bestByIssue.set(entry.issue, entry);
  });
  const matched = bestByIssue.size;
  const qualityPoints = [...bestByIssue.values()].reduce((sum, entry) => sum + entry.checks.filter(check => check.pass).length, 0);
  const indicator = Math.round(matched * 20 + (qualityPoints / 15) * 40);
  const root = $("assessmentResults");
  root.replaceChildren();
  const head = element("div", "assessment-result-head");
  const headingGroup = element("div", "");
  headingGroup.append(element("span", "section-kicker", "YOUR PRACTICE REVIEW"), element("h3", "", "Challenge feedback"));
  const score = element("div", "assessment-score", `${indicator}/100`);
  score.setAttribute("aria-label", `Rule-based practice indicator: ${indicator} out of 100`);
  head.append(headingGroup, score);
  root.append(head);
  const metrics = element("div", "assessment-metrics");
  metrics.append(element("div", "assessment-metric", `Likely known issues: ${matched} / 3`));
  metrics.append(element("div", "assessment-metric", `Reports reviewed: ${reports.length}`));
  root.append(metrics);
  root.append(element("p", "assessment-explanation", "Indicative score: up to 60 points for three distinct likely known issues (20 each), plus up to 40 for report-writing checks on the best report for each matched issue. Matching is based on words and selected requirements; it is not verification of the actual defect or a measure of professional QA ability."));
  root.append(element("p", "assessment-progress-save", saveCheckoutChallengeScore(indicator)));
  const list = element("div", "assessment-report-list");
  reports.forEach((entry, index) => {
    const item = element("article", "assessment-report");
    item.append(element("h4", "", `Report ${reports.length - index}: ${entry.report.title}`));
    const isBest = entry.issue && bestByIssue.get(entry.issue) === entry;
    const verdict = entry.issue
      ? (isBest ? `Possible match: ${ASSESSMENT_ISSUES[entry.issue].label}` : `Possible duplicate: ${ASSESSMENT_ISSUES[entry.issue].label} (counted once)`)
      : "Not confidently matched to a seeded defect";
    item.append(element("p", isBest ? "match-positive" : "match-neutral", verdict));
    const succeeded = entry.checks.filter(check => check.pass).length;
    item.append(element("p", "", `Documentation checks: ${succeeded} / 5`));
    const suggestions = entry.checks.filter(check => !check.pass).map(check => check.advice);
    if (!entry.issue) suggestions.unshift("Check that the selected requirement fits the observed issue, and contrast what should happen with what actually happened. An unmatched report is not automatically incorrect.");
    if (entry.report.severity === "Critical") suggestions.push("Review the suggested Critical severity against the actual impact and your team's severity definitions.");
    if (!suggestions.length) suggestions.push("All five automated documentation checks passed. Add a screenshot or log evidence if it helps another tester reproduce the issue.");
    const ul = element("ul", "assessment-suggestions");
    suggestions.forEach(suggestion => ul.append(element("li", "", suggestion)));
    item.append(ul);
    list.append(item);
  });
  root.append(list);
  root.hidden = false;
  $("answerGuide").hidden = false;
  $("assessmentHint").textContent = "Challenge finished. Review your feedback and the now-visible answer guide below. Editing reports will hide these results until you finish again.";
  root.scrollIntoView({ behavior: "smooth", block: "start" });
  notify("Challenge feedback is ready.");
}

document.addEventListener("DOMContentLoaded", () => {
  $("productGrid").addEventListener("click", event => {
    const button = event.target.closest("[data-add]");
    if (button) addToCart(button.dataset.add);
  });
  $("cartItems").addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "increase") changeQuantity(id, 1);
    else if (action === "decrease") changeQuantity(id, -1);
    else if (action === "remove") removeProduct(id);
  });
  $("discountForm").addEventListener("submit", applyPromotion);
  $("resetShop").addEventListener("click", resetShop);
  $("placeOrder").addEventListener("click", placeTestOrder);
  setupReportForm();
  render();
});
