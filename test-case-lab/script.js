"use strict";

// v0.8 Stage 4: Test case authoring, rule-based review, and progress integration.
// This key is intentionally separate from Practical QA Lab progress/history storage.
const STORAGE_KEY = "pqa_test_case_lab_stage2_v1";
const MAX_CASES = 100;
const allowedRequirements = new Set(Array.from({length: 8}, (_, i) => `REQ-${String(i + 1).padStart(2, "0")}`));
const allowedTypes = new Set(["Positive", "Negative", "Boundary"]);
const allowedPriorities = new Set(["High", "Medium", "Low"]);

const form = document.getElementById("testCaseForm");
const caseList = document.getElementById("caseList");
const formCaseId = document.getElementById("formCaseId");
const formHeading = document.getElementById("form-heading");
const saveButton = document.getElementById("saveCase");
const cancelButton = document.getElementById("cancelEdit");
const formMessage = document.getElementById("formMessage");
const reviewButton = document.getElementById("reviewCases");
const reviewMessage = document.getElementById("reviewMessage");
const reviewResults = document.getElementById("reviewResults");
const exportDraftButton = document.getElementById("exportDrafts");
const importDraftButton = document.getElementById("importDrafts");
let selectedDraftBackup = null;
let draftImportReading = false;
let draftFileSelectionToken = 0;
const designGuide = document.getElementById("designGuide");
let draftState = {version: 1, nextSequence: 1, cases: []};
let editingId = null;
let storageAvailable = true;

function isValidCase(c) {
  return c && typeof c === "object" && typeof c.id === "string" &&
    allowedRequirements.has(c.requirement) && allowedTypes.has(c.type) &&
    allowedPriorities.has(c.priority) &&
    ["scenario", "preconditions", "steps", "testData", "expectedResult"].every(k => typeof c[k] === "string");
}

function loadDrafts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !Number.isSafeInteger(parsed.nextSequence) || parsed.nextSequence < 1 || !Array.isArray(parsed.cases) || parsed.cases.length > MAX_CASES || !parsed.cases.every(isValidCase)) throw Error("Invalid saved data");
    draftState = parsed;
  } catch (err) {
    storageAvailable = false;
    displayMessage("Saved drafts could not be loaded. Your browser may restrict storage; try opening the site through localhost.", true);
  }
}

function persist(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    draftState = next;
    storageAvailable = true;
    return true;
  } catch (err) {
    storageAvailable = false;
    displayMessage("Could not save in browser storage. Check your browser settings or available space.", true);
    return false;
  }
}

function displayMessage(message, error = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", error);
}

function upcomingId() {
  return `TC-${String(draftState.nextSequence).padStart(3, "0")}`;
}

function updateFormState() {
  const current = draftState.cases.find(c => c.id === editingId);
  formCaseId.textContent = current ? current.id : upcomingId();
  formHeading.textContent = current ? `Edit ${current.id}` : "Create a test case";
  saveButton.textContent = current ? "Save changes" : "Save test case";
  cancelButton.hidden = !current;
}

function readFields() {
  const fields = new FormData(form);
  const result = {};
  for (const name of ["requirement", "testType", "scenario", "preconditions", "steps", "testData", "expectedResult", "priority"]) {
    result[name] = String(fields.get(name) || "").trim();
  }
  return result;
}

function validate(fields) {
  if (!allowedRequirements.has(fields.requirement) || !allowedTypes.has(fields.testType) || !allowedPriorities.has(fields.priority)) return "Choose a valid requirement, test type and priority.";
  for (const field of ["scenario", "steps", "testData", "expectedResult"]) {
    if (!fields[field]) return "Complete the scenario, steps, test data and expected result before saving.";
  }
  const limits = {scenario: 180, preconditions: 600, steps: 2400, testData: 1000, expectedResult: 1300};
  if (Object.entries(limits).some(([key, len]) => fields[key].length > len)) return "One or more fields exceed the maximum allowed length.";
  return "";
}

function resetEditor(message = "") {
  form.reset();
  editingId = null;
  updateFormState();
  displayMessage(message);
  renderCases();
}

function el(tag, className = "", content = null) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== null) node.textContent = content;
  return node;
}

function renderDetail(parent, label, value) {
  const dl = el("dl", "case-detail");
  dl.append(el("dt", "", label), el("dd", "", value || "Not specified"));
  parent.append(dl);
}

function renderCases() {
  const cases = draftState.cases;
  const referenced = new Set(cases.map(c => c.requirement));
  const types = new Set(cases.map(c => c.type));
  document.getElementById("totalCases").textContent = String(cases.length);
  document.getElementById("reqCoverage").textContent = `${referenced.size}/8`;
  document.getElementById("typeCoverage").textContent = `${types.size}/3`;
  document.getElementById("savedCount").textContent = String(cases.length);
  caseList.replaceChildren();
  updateDraftImportPreview();
  reviewButton.disabled = cases.length === 0;
  exportDraftButton.disabled = cases.length === 0;
  document.getElementById("exportDraftMessage").textContent = cases.length
    ? `${cases.length} saved test ${cases.length === 1 ? "case" : "cases"} available to back up.`
    : "Save a test case to enable the download.";
  if (!cases.length && reviewResults.hidden) reviewMessage.textContent = "Save at least one test case to unlock feedback.";
  if (!cases.length) {
    const empty = el("div", "empty-state");
    const symbol = el("span", "", "▤");
    symbol.setAttribute("aria-hidden", "true");
    empty.append(symbol, el("strong", "", "No test cases yet"), el("p", "", "Create and save your first test case using the form."));
    caseList.append(empty);
    return;
  }
  [...cases].reverse().forEach(c => {
    const card = el("article", `case-card${editingId === c.id ? " editing" : ""}`);
    const top = el("div", "case-head");
    const topLeft = el("div");
    const labels = el("div", "case-label");
    labels.append(el("span", "case-id", c.id), el("span", "case-type", c.type));
    topLeft.append(labels, el("h4", "", c.scenario));
    topLeft.append(el("p", "case-sub", `${c.requirement} · ${c.updatedAt ? "Updated" : "Created"} ${new Date(c.updatedAt || c.createdAt).toLocaleDateString()}`));
    top.append(topLeft, el("span", `priority-pill priority-${c.priority.toLowerCase()}`, `${c.priority} priority`));
    card.append(top);
    renderDetail(card, "Preconditions", c.preconditions);
    renderDetail(card, "Test steps", c.steps);
    renderDetail(card, "Test data", c.testData);
    renderDetail(card, "Expected result", c.expectedResult);
    const actions = el("div", "case-actions");
    const edit = el("button", "", "Edit test case");
    edit.type = "button"; edit.dataset.action = "edit"; edit.dataset.id = c.id;
    const remove = el("button", "delete", "Delete test case");
    remove.type = "button"; remove.dataset.action = "delete"; remove.dataset.id = c.id;
    actions.append(edit, remove); card.append(actions); caseList.append(card);
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const fields = readFields();
  const error = validate(fields);
  if (error) { displayMessage(error, true); return; }
  const existing = draftState.cases.find(c => c.id === editingId);
  if (!existing && draftState.cases.length >= MAX_CASES) { displayMessage("You've reached the 100-case limit for this practice workspace.", true); return; }
  const now = new Date().toISOString();
  const saved = { id: existing ? existing.id : upcomingId(), requirement: fields.requirement, type: fields.testType, scenario: fields.scenario, preconditions: fields.preconditions, steps: fields.steps, testData: fields.testData, expectedResult: fields.expectedResult, priority: fields.priority, createdAt: existing ? existing.createdAt : now, ...(existing ? {updatedAt: now} : {})};
  const next = {version: 1, nextSequence: draftState.nextSequence + (existing ? 0 : 1), cases: existing ? draftState.cases.map(c => c.id === existing.id ? saved : c) : [...draftState.cases, saved]};
  if (persist(next)) { invalidateReview(); resetEditor(`${saved.id} ${existing ? "updated" : "saved"} successfully. Your draft is stored in this browser.`); }
});

caseList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action][data-id]");
  if (!button) return;
  const id = button.dataset.id;
  const c = draftState.cases.find(entry => entry.id === id);
  if (!c) return;
  if (button.dataset.action === "edit") {
    editingId = id;
    const values = {requirement: c.requirement, testType: c.type, scenario: c.scenario, preconditions: c.preconditions, steps: c.steps, testData: c.testData, expectedResult: c.expectedResult, priority: c.priority};
    Object.entries(values).forEach(([name, value]) => {form.elements.namedItem(name).value = value;});
    updateFormState(); renderCases(); displayMessage(`Editing ${id}. Save changes or cancel to return to a new case.`);
    document.getElementById("workspace-heading").scrollIntoView({behavior: "smooth", block: "start"});
    form.elements.namedItem("scenario").focus({preventScroll:true});
  } else if (button.dataset.action === "delete") {
    if (!window.confirm(`Delete ${id}? This cannot be undone.`)) return;
    const next = { ...draftState, cases: draftState.cases.filter(entry => entry.id !== id) };
    if (persist(next)) {
      invalidateReview();
      if (editingId === id) resetEditor(`${id} deleted.`);
      else {renderCases(); displayMessage(`${id} deleted.`);}
    }
  }
});

cancelButton.addEventListener("click", () => resetEditor("Editing cancelled. Your saved test case was not changed."));
loadDrafts();
updateFormState();
renderCases();


// Stage 3 assessment. All checks are intentionally transparent heuristics.
// The draft storage shape/key is unchanged, preserving Stage 2 browser data.
const REQUIREMENT_NAMES = {
  "REQ-01": "Required fields", "REQ-02": "Email format", "REQ-03": "Password rules",
  "REQ-04": "Confirm password", "REQ-05": "Duplicate email", "REQ-06": "Terms acceptance",
  "REQ-07": "Successful registration", "REQ-08": "Invalid submission"
};
const TYPE_NAMES = ["Positive", "Negative", "Boundary"];

function invalidateReview() {
  reviewResults.hidden = true;
  designGuide.hidden = true;
  reviewMessage.textContent = draftState.cases.length
    ? "Drafts changed. Review your test cases again to see updated feedback."
    : "Save at least one test case to unlock feedback.";
  document.getElementById("designProgressSaveStatus").textContent = "";
}

function compact(text) {
  return String(text || "").toLowerCase().trim().replace(/\s+/g, " ");
}

function fingerprint(testCase) {
  // Require matching requirement, type, scenario, steps, data AND expected result.
  // Similar boundary cases with different test values should not be duplicates.
  return [testCase.requirement, testCase.type, testCase.scenario, testCase.steps,
    testCase.testData, testCase.expectedResult].map(compact).join("|");
}

function documentationChecks(c) {
  const numberedSteps = c.steps.split(/\r?\n/).filter(line => /^\s*\d+[.)]\s+\S/.test(line));
  return [
    {pass: c.scenario.trim().length >= 22, label: "Describe one precise scenario or condition in the title."},
    {pass: numberedSteps.length >= 2, label: "Number at least two concrete actions in the execution steps."},
    {pass: /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(c.testData) && (/(password|confirm|terms)/i.test(c.testData) || /\b[A-Z][a-z]+\d+\b/.test(c.testData)), label: "Include a fictional email and other explicit inputs (password, confirmation or terms)."},
    {pass: /(message|error|reject|invalid|fail|success|account|creat|display|validat|register|block|prevent|prompt|accept)/i.test(c.expectedResult) && c.expectedResult.length >= 30, label: "State an observable result, such as a validation message or account creation outcome."},
    {pass: c.preconditions.trim().length >= 7, label: "Specify prerequisites or explicitly state that none apply."}
  ];
}

function evaluateDrafts(cases) {
  const requirementSet = new Set(cases.map(c => c.requirement));
  const typeSet = new Set(cases.map(c => c.type));
  const grouped = new Map();
  for (const c of cases) {
    const key = fingerprint(c);
    const entries = grouped.get(key) || [];
    entries.push(c.id);
    grouped.set(key, entries);
  }
  const firstIdForKey = new Map([...grouped].map(([key, ids]) => [key, ids[0]]));
  const checks = cases.map(c => ({id: c.id, scenario: c.scenario, checks: documentationChecks(c),
    duplicateOf: firstIdForKey.get(fingerprint(c)) === c.id ? null : firstIdForKey.get(fingerprint(c))}));
  const qualityTotal = checks.reduce((sum, c) => sum + c.checks.filter(item => item.pass).length, 0);
  const coveragePts = cases.length ? Math.round(requirementSet.size / 8 * 40) : 0;
  const diversityPts = cases.length ? Math.round(typeSet.size / 3 * 15) : 0;
  const docPts = cases.length ? Math.round(qualityTotal / (cases.length * 5) * 30) : 0;
  const uniqueCount = grouped.size;
  const uniquePts = cases.length ? Math.round(uniqueCount / cases.length * 15) : 0;
  return {cases, requirementSet, typeSet, checks, uniqueCount, coveragePts, diversityPts, docPts, uniquePts,
    total: Math.min(100, coveragePts + diversityPts + docPts + uniquePts)};
}

function renderReview(data) {
  document.getElementById("reviewScore").textContent = `${data.total}/100`;
  const breakdown = document.getElementById("reviewBreakdown");
  breakdown.replaceChildren();
  for (const [label, points, max] of [
    ["Requirements referenced", data.coveragePts, 40], ["Test type diversity", data.diversityPts, 15],
    ["Documentation checks", data.docPts, 30], ["Nonduplicate scenarios", data.uniquePts, 15]
  ]) {
    const item = el("div", "breakdown-item");
    item.append(el("span", "", label), el("strong", "", `${points}/${max}`));
    breakdown.append(item);
  }
  const requirements = document.getElementById("reviewRequirements");
  requirements.replaceChildren();
  Object.entries(REQUIREMENT_NAMES).forEach(([id, name]) => {
    const row = el("div", "coverage-row");
    const seen = data.requirementSet.has(id);
    row.append(el("span", "", `${id} · ${name}`), el("span", seen ? "covered-tag" : "missing-tag", seen ? "Referenced" : "Not referenced"));
    requirements.append(row);
  });

  const suggestions = document.getElementById("reviewSuggestions");
  suggestions.replaceChildren();
  const missingReqs = Object.keys(REQUIREMENT_NAMES).filter(id => !data.requirementSet.has(id));
  const messages = [];
  if (missingReqs.length) messages.push(`Add cases for requirements not yet referenced: ${missingReqs.join(", ")}. One requirement label alone doesn't guarantee full coverage.`);
  const missingTypes = TYPE_NAMES.filter(t => !data.typeSet.has(t));
  if (missingTypes.length) messages.push(`Add ${missingTypes.join(" and ").toLowerCase()} cases to widen your test design techniques.`);
  if (data.requirementSet.has("REQ-03")) messages.push("For password length 8–20, consider 7, 8, 9 and 19, 20, 21 separately; isolate the length rule from other password rules.");
  const duplicates = data.cases.length - data.uniqueCount;
  if (duplicates) messages.push(`${duplicates} potential identical duplicate ${duplicates === 1 ? "case was" : "cases were"} found. Preserve distinct data and expectations; don't copy the same case unchanged.`);
  if (data.docPts < 30) messages.push("Review the documentation suggestions below, especially numbered steps and concrete test data.");
  if (!messages.length) messages.push("All requirements and testing types are represented. Next, ask another tester to review whether the scenarios are truly sufficient and logically correct.");
  messages.forEach(message => suggestions.append(el("li", "", message)));

  const caseFeedback = document.getElementById("reviewCaseFeedback");
  caseFeedback.replaceChildren();
  for (const item of data.checks) {
    const card = el("article", "case-review-item");
    card.append(el("h5", "", `${item.id}: ${item.scenario}`));
    const passed = item.checks.filter(check => check.pass).length;
    card.append(el("p", "case-review-meta", `Basic documentation checks: ${passed}/5`));
    if (item.duplicateOf) card.append(el("p", "duplicate-alert", `Possible identical duplicate of ${item.duplicateOf}. Counted only once for uniqueness.`));
    const failed = item.checks.filter(check => !check.pass);
    if (failed.length) {
      const bullets = el("ul", "advice-list");
      failed.forEach(check => bullets.append(el("li", "", check.label)));
      card.append(bullets);
    } else {
      card.append(el("p", "good-feedback", "All five basic documentation checks passed. The content still needs human review for correctness and adequacy."));
    }
    caseFeedback.append(card);
  }
  reviewResults.hidden = false;
  designGuide.hidden = false;
  reviewMessage.textContent = `Review generated for ${data.cases.length} saved test ${data.cases.length === 1 ? "case" : "cases"}. Editing or deleting a case will hide this review until you run it again.`;
}

// Stage 4: Use the same version-1 session shape as v0.6 and Checkout Bug Hunt.
// The test case drafts themselves are intentionally NOT included in score backups.
const DESIGN_PROGRESS_KEY = "practicalQaLab.progress.v1";
const DESIGN_PROGRESS_MAX_HISTORY = 250;

function savedDesignFingerprint() {
  // Stable across refreshes; ignore createdAt/updatedAt so a no-op edit
  // does not manufacture a different attempt. Include the ID and all contents.
  const sorted = [...draftState.cases].sort((a, b) => a.id.localeCompare(b.id));
  const data = JSON.stringify(sorted.map(c => [
    c.id, c.requirement, c.type, c.scenario, c.preconditions,
    c.steps, c.testData, c.expectedResult, c.priority
  ]));
  let a = 2166136261;
  let b = 2246822519;
  for (let i = 0; i < data.length; i++) {
    const value = data.charCodeAt(i);
    a = Math.imul(a ^ value, 16777619);
    b = Math.imul(b ^ value, 3266489917);
  }
  return `testcase-${(a >>> 0).toString(36)}-${(b >>> 0).toString(36)}`;
}

function saveDesignReviewScore(score) {
  try {
    const current = JSON.parse(localStorage.getItem(DESIGN_PROGRESS_KEY) || "[]");
    if (!Array.isArray(current))
      return { error: true, message: "Saved progress has an unexpected format; nothing was changed." };
    const id = savedDesignFingerprint();
    if (current.some(item => item && item.id === id))
      return { error: false, message: "This unchanged test case set was already saved to My Progress. Edit or add a test case before recording a new attempt." };

    // Do not corrupt or discard previous practice, interview or Bug Hunt results.
    const valid = current.every(item => item && typeof item === "object" &&
      typeof item.id === "string" && typeof item.type === "string" &&
      typeof item.area === "string" && Number.isFinite(item.score) &&
      Number.isFinite(item.maxScore) && typeof item.completedAt === "string");
    if (!valid)
      return { error: true, message: "Existing history needs attention. It was left unchanged." };

    const entry = {
      id, type: "challenge", area: "testcase", score, maxScore: 100,
      completedAt: new Date().toISOString(), questionScores: []
    };
    const recent = [entry, ...current].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    localStorage.setItem(DESIGN_PROGRESS_KEY, JSON.stringify(recent.slice(0, DESIGN_PROGRESS_MAX_HISTORY)));
    return { error: false, message: "✓ Review score saved to My Progress. Return to Practical QA Lab and open View my progress." };
  } catch (error) {
    return { error: true, message: "Feedback is available, but this browser could not save your progress. Your test case drafts were not changed." };
  }
}

reviewButton.addEventListener("click", () => {
  if (!draftState.cases.length) return;
  const result = evaluateDrafts(draftState.cases);
  renderReview(result);
  const status = saveDesignReviewScore(result.total);
  const saveMessage = document.getElementById("designProgressSaveStatus");
  saveMessage.textContent = status.message;
  saveMessage.dataset.error = status.error ? "true" : "false";
  reviewResults.scrollIntoView({behavior: "smooth", block: "start"});
});


// Draft backup is separate from the existing score-history export.
// No server, account, or change to the Stage 2 localStorage key is required.
const DRAFT_BACKUP_FORMAT = "practical-qa-lab-testcases";
const DRAFT_BACKUP_VERSION = 1;
const DRAFT_BACKUP_LIMIT = 2 * 1024 * 1024;
const fileSelector = document.getElementById("draftBackupFile");
const importPreview = document.getElementById("draftImportPreview");
function canonicalCaseSignature(c) {
  return [c.requirement, c.type, c.scenario, c.preconditions, c.steps,
    c.testData, c.expectedResult, c.priority].map(compact).join("\u001f");
}

function caseNumber(id) {
  const match = /^TC-(\d{3,})$/.exec(id);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isSafeInteger(n) && n >= 1 && n <= 999999 ? n : null;
}

function validDate(s) {
  return typeof s === "string" && s.length <= 40 && Number.isFinite(Date.parse(s));
}

function readDraftBackup(raw) {
  let source;
  try { source = JSON.parse(raw); } catch { throw Error("This file does not contain valid JSON."); }
  if (!source || typeof source !== "object" || Array.isArray(source) ||
      source.format !== DRAFT_BACKUP_FORMAT || source.version !== DRAFT_BACKUP_VERSION ||
      !validDate(source.exportedAt) || !Array.isArray(source.cases) ||
      !Number.isSafeInteger(source.nextSequence) || source.nextSequence < 1 || source.nextSequence > 999999) {
    throw Error("Unsupported Test Case Lab backup. A version 1 test-case backup is required (not a progress-score export).");
  }
  if (!source.cases.length) throw Error("This backup has no test cases to restore.");
  if (source.cases.length > MAX_CASES) throw Error("A backup may contain at most 100 test cases.");
  const ids = new Set();
  const cases = source.cases.map(c => {
    if (!c || typeof c !== "object" || Array.isArray(c) || !isValidCase(c) || caseNumber(c.id) === null ||
        !validDate(c.createdAt) || (c.updatedAt !== undefined && !validDate(c.updatedAt))) {
      throw Error("One or more test cases contain invalid IDs, fields, or dates. Nothing has been imported.");
    }
    const candidate = {
      requirement: c.requirement, testType: c.type, scenario: c.scenario,
      preconditions: c.preconditions, steps: c.steps, testData: c.testData,
      expectedResult: c.expectedResult, priority: c.priority
    };
    if (validate(candidate)) throw Error("A test case contains invalid or incomplete fields. Nothing has been imported.");
    if (ids.has(c.id)) throw Error("The backup contains duplicate test case IDs. Nothing has been imported.");
    ids.add(c.id);
    return { id:c.id, requirement:c.requirement, type:c.type, scenario:c.scenario,
      preconditions:c.preconditions, steps:c.steps, testData:c.testData,
      expectedResult:c.expectedResult, priority:c.priority, createdAt:c.createdAt,
      ...(c.updatedAt !== undefined ? { updatedAt:c.updatedAt } : {}) };
  });
  return {nextSequence:source.nextSequence, cases};
}

function importMode() {
  return document.querySelector('input[name="draftImportMode"]:checked').value;
}

function buildDraftImportPlan(source, mode) {
  if (mode === "replace") {
    const highest = Math.max(0, ...source.cases.map(c => caseNumber(c.id)));
    return { next:{version:1, nextSequence:Math.max(source.nextSequence,highest+1),
      cases:source.cases.map(c => ({...c}))}, added:source.cases.length,
      skipped:0, reassigned:0, existing:draftState.cases.length, mode };
  }
  const all = draftState.cases.map(c => ({...c}));
  const seen = new Set(all.map(canonicalCaseSignature));
  const occupied = new Set(all.map(c => c.id));
  const highest = Math.max(0,...all.map(c => caseNumber(c.id) || 0),
    ...source.cases.map(c => caseNumber(c.id) || 0));
  let nextSequence = Math.max(draftState.nextSequence,source.nextSequence,highest+1);
  let added=0, skipped=0, reassigned=0;
  for (const c of source.cases) {
    const signature = canonicalCaseSignature(c);
    if (seen.has(signature)) { skipped++; continue; }
    if (all.length >= MAX_CASES) throw Error("Merging would exceed the 100-test-case limit. Nothing will be imported.");
    const incoming = {...c};
    if (occupied.has(incoming.id)) {
      while (occupied.has(`TC-${String(nextSequence).padStart(3,"0")}`)) nextSequence++;
      if (nextSequence > 999999) throw Error("There are no available test case IDs for the merge.");
      incoming.id = `TC-${String(nextSequence).padStart(3,"0")}`;
      nextSequence++; reassigned++;
    }
    occupied.add(incoming.id); seen.add(signature); all.push(incoming); added++;
  }
  return {next:{version:1,nextSequence,cases:all}, added,skipped,reassigned,
    existing:draftState.cases.length,mode};
}

function updateDraftImportPreview() {
  importDraftButton.disabled = true;
  if (!selectedDraftBackup || draftImportReading) return;
  try {
    const plan = buildDraftImportPlan(selectedDraftBackup,importMode());
    importPreview.dataset.error = "false";
    if (plan.mode === "merge") {
      importPreview.textContent = `Backup verified: ${selectedDraftBackup.cases.length} test case(s). ` +
        `Merge would add ${plan.added}, skip ${plan.skipped} identical, ` +
        `and retain ${plan.existing} existing. ` +
        (plan.reassigned ? `${plan.reassigned} conflicting ID(s) would be renumbered. ` : "") +
        (plan.added ? "Existing drafts will not be overwritten." : "Nothing new to import.");
      importDraftButton.disabled = plan.added === 0;
    } else {
      importPreview.textContent = `Ready to replace ${plan.existing} existing test case(s) ` +
        `with ${plan.added} from this backup. Confirmation required. ` +
        `Only the written drafts change; saved progress scores are unaffected.`;
      importDraftButton.disabled = false;
    }
  } catch (error) {
    importPreview.dataset.error = "true";
    importPreview.textContent = error.message;
  }
}

exportDraftButton.addEventListener("click", () => {
  if (!draftState.cases.length) return;
  const backup = {
    format:DRAFT_BACKUP_FORMAT, version:DRAFT_BACKUP_VERSION,
    exportedAt:new Date().toISOString(), nextSequence:draftState.nextSequence,
    cases:draftState.cases.map(c => ({...c}))
  };
  try {
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup,null,2)],{type:"application/json"}));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `practical-qa-lab-testcases-${new Date().toISOString().slice(0,10)}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url),10000);
    document.getElementById("exportDraftMessage").textContent =
      `Backup prepared for ${draftState.cases.length} test case(s). Keep the downloaded file safe.`;
  } catch {
    document.getElementById("exportDraftMessage").textContent =
      "The download could not start. Try again or check your browser's download settings.";
  }
});

fileSelector.addEventListener("change", async () => {
  const token = ++draftFileSelectionToken;
  selectedDraftBackup = null;
  draftImportReading = true;
  importDraftButton.disabled = true;
  const file = fileSelector.files && fileSelector.files[0];
  if (!file) {
    draftImportReading = false;
    importPreview.dataset.error = "false";
    importPreview.textContent = "Select a JSON backup to preview it. Nothing will be changed until you confirm.";
    return;
  }
  try {
    if (!/\.json$/i.test(file.name)) throw Error("Choose a .json Test Case Lab backup file.");
    if (file.size > DRAFT_BACKUP_LIMIT) throw Error("This file is too large. The maximum backup size is 2 MB.");
    importPreview.dataset.error = "false";
    importPreview.textContent = "Checking backup…";
    const parsed = readDraftBackup(await file.text());
    if (token !== draftFileSelectionToken) return;
    selectedDraftBackup = parsed;
    draftImportReading = false;
    updateDraftImportPreview();
  } catch (error) {
    if (token !== draftFileSelectionToken) return;
    draftImportReading = false;
    importPreview.dataset.error = "true";
    importPreview.textContent = error.message;
  }
});

document.querySelectorAll('input[name="draftImportMode"]').forEach(radio =>
  radio.addEventListener("change", updateDraftImportPreview));

importDraftButton.addEventListener("click", () => {
  if (!selectedDraftBackup || draftImportReading) return;
  let plan;
  try { plan = buildDraftImportPlan(selectedDraftBackup,importMode()); }
  catch (error) { updateDraftImportPreview(); return; }
  if (plan.mode === "merge" && !plan.added) {updateDraftImportPreview();return;}
  if (plan.mode === "replace" && !window.confirm(
    `Replace all ${plan.existing} current test cases with ${plan.added} cases from this backup? ` +
    "This removes your current written drafts. Export a backup first if you want to keep them.")) return;
  if (!persist(plan.next)) {
    importPreview.dataset.error = "true";
    importPreview.textContent = "The browser could not save the imported cases. Existing drafts were not changed.";
    return;
  }
  invalidateReview();
  resetEditor(plan.mode === "merge"
    ? `${plan.added} case(s) imported. ${plan.skipped} identical skipped. ${plan.reassigned} conflicting ID(s) renumbered.`
    : `${plan.added} case(s) restored. Previous drafts replaced.`);
  selectedDraftBackup = null;
  fileSelector.value = "";
  importDraftButton.disabled = true;
  importPreview.dataset.error = "false";
  importPreview.textContent = plan.mode === "merge"
    ? `Import complete: ${plan.added} added, ${plan.skipped} identical skipped. Your saved drafts are updated.`
    : `Restore complete: ${plan.added} case(s) loaded. Your saved progress scores were not modified.`;
});
