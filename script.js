const questionBanks = {
  manual: {
    name: "MANUAL QA",
    questions: [
      {
        question: "A customer successfully completes checkout, but the order does not appear in Order History. How would you investigate this issue?",
        criteria: [
          { words: ["reproduce","reproduction"], label: "Attempt to reproduce the issue", weight: 2 },
          { words: ["api","request","response"], label: "Check the API request and response", weight: 3 },
          { words: ["database","db","stored","persistence"], label: "Verify whether the order was stored", weight: 3 },
          { words: ["logs","logging","order id","transaction"], label: "Trace the transaction using logs or identifiers", weight: 1 },
          { words: ["cache","async","queue","delay","eventual"], label: "Consider caching or asynchronous processing", weight: 1 },
        ]
      },
      {
        question: "Login works correctly in Chrome on desktop, but users cannot log in using Safari on an iPhone. How would you investigate?",
        criteria: [
          { words: ["reproduce","retest on iphone","test on iphone","safari on iphone","affected device"], label: "Reproduce under the affected device/browser conditions", weight: 3 },
          { words: ["version","browser","os","ios"], label: "Check browser and operating-system versions", weight: 1 },
          { words: ["network","api","request","response"], label: "Compare network/API behavior", weight: 3 },
          { words: ["cookie","session","storage","token"], label: "Investigate cookies, sessions, storage or authentication tokens", weight: 2 },
          { words: ["logs","console","error","devtools"], label: "Inspect errors, logs or debugging information", weight: 1 },
        ]
      },
      {
        question: "A product search sometimes shows the same product twice in the results. How would you investigate the defect?",
        criteria: [
          { words: ["reproduce","search term","query"], label: "Identify reproducible search conditions", weight: 2 },
          { words: ["api","response","payload"], label: "Check whether duplicates come from the API", weight: 3 },
          { words: ["database","db","source records","duplicate records"], label: "Check for duplicate source records", weight: 2 },
          { words: ["pagination","page","cache"], label: "Investigate pagination or caching behavior", weight: 2 },
          { words: ["frontend","ui","render","display"], label: "Check whether the UI renders records more than once", weight: 1 },
        ]
      },
      {
        question: "A customer reports that their card was charged twice, but only one order was created. What would you do?",
        criteria: [
          { words: ["high severity","critical severity","critical issue","escalate","business impact"], label: "Recognize the high business impact", weight: 2 },
          { words: ["payment","gateway","processor","transaction"], label: "Investigate payment-provider transactions", weight: 2 },
          { words: ["idempotency","duplicate request","retry"], label: "Check duplicate requests, retries or idempotency", weight: 3 },
          { words: ["database","db","order records","payment records"], label: "Compare payment and order records", weight: 2 },
          { words: ["logs","timestamp","request id","evidence"], label: "Collect traceable evidence", weight: 1 },
        ]
      },
      {
        question: "A user updates their profile and sees a success message, but after refreshing the page the old information returns. How would you investigate?",
        criteria: [
          { words: ["api","request","response","status"], label: "Inspect the update API request and response", weight: 3 },
          { words: ["database","db","persist","saved"], label: "Verify whether the new data was persisted", weight: 3 },
          { words: ["cache","cached","stale"], label: "Consider stale or cached data", weight: 2 },
          { words: ["frontend","frontend state","ui state"], label: "Check temporary frontend state", weight: 1 },
          { words: ["logs","error","backend"], label: "Inspect backend errors or logs", weight: 1 },
        ]
      },
    ]
  },
  api: {
    name: "API TESTING",
    questions: [
      {
        question: "A POST /orders request returns 201 Created, but the new order cannot be retrieved using GET /orders/{id}. How would you investigate?",
        criteria: [
          { words: ["response","body","order id","id"], label: "Inspect the POST response and generated order ID", weight: 2 },
          { words: ["get","endpoint","request"], label: "Validate the follow-up GET request", weight: 2 },
          { words: ["database","db","persist","stored"], label: "Verify whether the order was persisted", weight: 3 },
          { words: ["logs","backend","service"], label: "Inspect backend/service logs", weight: 1 },
          { words: ["async","delay","eventual","queue"], label: "Consider asynchronous or eventual processing", weight: 2 },
        ]
      },
      {
        question: "An API should reject requests without authentication, but GET /customers returns customer data without a token. What would you test next?",
        criteria: [
          { words: ["401","unauthorized","authentication"], label: "Verify expected authentication behavior", weight: 3 },
          { words: ["token","missing","invalid","expired"], label: "Test missing, invalid and expired tokens", weight: 2 },
          { words: ["authorization","role","permission","403"], label: "Check authorization and access controls", weight: 2 },
          { words: ["sensitive data","privacy","security impact","data exposure","security risk"], label: "Recognize the data/security impact", weight: 2 },
          { words: ["report","escalate","severity","critical"], label: "Escalate and report the security defect appropriately", weight: 1 },
        ]
      },
      {
        question: "GET /products?page=2 sometimes returns products that were already returned on page 1. How would you investigate?",
        criteria: [
          { words: ["pagination","page","limit","offset"], label: "Inspect pagination parameters", weight: 3 },
          { words: ["sort","sort order","stable sort","deterministic order"], label: "Check deterministic sorting", weight: 2 },
          { words: ["duplicate id","product id","unique id","unique identifier"], label: "Compare unique product identifiers", weight: 2 },
          { words: ["data change","created","updated","concurrent"], label: "Consider data changing between requests", weight: 2 },
          { words: ["response","api","backend"], label: "Compare raw API responses", weight: 1 },
        ]
      },
      {
        question: "A PUT /users/42 request returns 200 OK, but one field in the response still contains the old value. What would you check?",
        criteria: [
          { words: ["request body","payload","field"], label: "Verify the request payload", weight: 2 },
          { words: ["response body","response"], label: "Inspect the complete response body", weight: 2 },
          { words: ["database","db","persist"], label: "Verify persisted database values", weight: 3 },
          { words: ["put semantics","patch semantics","api contract","update semantics"], label: "Confirm endpoint update semantics", weight: 2 },
          { words: ["cache","mapping","serialization"], label: "Investigate caching or response mapping", weight: 1 },
        ]
      },
      {
        question: "POST /payments occasionally creates two payment records when the client retries after a timeout. How would you test and investigate this?",
        criteria: [
          { words: ["idempotency","idempotency key"], label: "Check idempotency protection", weight: 3 },
          { words: ["retry","timeout","duplicate"], label: "Reproduce timeout/retry behavior", weight: 2 },
          { words: ["database","records","transaction"], label: "Compare stored payment records", weight: 2 },
          { words: ["logs","request id","trace"], label: "Trace duplicate requests through logs", weight: 1 },
          { words: ["financial risk","payment risk","business impact","high severity","critical severity"], label: "Recognize the financial/business risk", weight: 2 },
        ]
      },
    ]
  },
  sql: {
    name: "SQL TESTING",
    questions: [
      {
        question: "A customer says their order is missing from the application. How would you use SQL to verify whether the order exists in the database?",
        criteria: [
          { words: ["select","query"], label: "Use a SELECT query to retrieve the record", weight: 2 },
          { words: ["where","order id","customer id"], label: "Filter using a reliable identifier", weight: 3 },
          { words: ["orders","table"], label: "Identify the relevant table", weight: 1 },
          { words: ["status","created","timestamp"], label: "Validate important order fields", weight: 2 },
          { words: ["api","ui","compare"], label: "Compare database data with application behavior", weight: 2 },
        ]
      },
      {
        question: "You suspect the users table contains duplicate email addresses. How would you investigate using SQL?",
        criteria: [
          { words: ["group by"], label: "Group records by email", weight: 2 },
          { words: ["count","count(*)"], label: "Count occurrences", weight: 2 },
          { words: ["having"], label: "Filter groups with more than one record", weight: 3 },
          { words: ["email"], label: "Use email as the duplicate key", weight: 1 },
          { words: ["unique constraint","uniqueness","duplicate prevention","constraint"], label: "Consider whether uniqueness should be enforced", weight: 2 },
        ]
      },
      {
        question: "The UI displays an order total of $120, but you suspect the stored amount is different. How would you validate it?",
        criteria: [
          { words: ["select","query"], label: "Query the relevant order data", weight: 2 },
          { words: ["order id","where"], label: "Locate the specific order", weight: 2 },
          { words: ["stored total","stored amount","database amount","price value","monetary value"], label: "Check the stored monetary value", weight: 2 },
          { words: ["items","sum","calculate"], label: "Validate the total against underlying items", weight: 3 },
          { words: ["ui","api","compare"], label: "Compare values across application layers", weight: 1 },
        ]
      },
      {
        question: "You need to find customers who have placed orders. How would you retrieve customer details together with their order information?",
        criteria: [
          { words: ["join","inner join"], label: "Use a JOIN between related tables", weight: 3 },
          { words: ["customers","users"], label: "Identify the customer table", weight: 1 },
          { words: ["orders"], label: "Identify the orders table", weight: 1 },
          { words: ["customer id","user id","foreign key"], label: "Join using the relationship key", weight: 3 },
          { words: ["select"], label: "Select the fields needed for validation", weight: 2 },
        ]
      },
      {
        question: "A user's profile update shows success, but the database still contains the old phone number. What would you investigate?",
        criteria: [
          { words: ["select","query"], label: "Query the user's stored record", weight: 2 },
          { words: ["user id","email","where"], label: "Locate the correct user reliably", weight: 2 },
          { words: ["transaction","commit","rollback"], label: "Consider transaction or commit behavior", weight: 3 },
          { words: ["api","backend","logs"], label: "Investigate the backend/API update process", weight: 2 },
          { words: ["timestamp","updated_at","audit"], label: "Check update timestamps or audit information", weight: 1 },
        ]
      },
    ]
  },
};

const interviewBanks = {
  junior: {
    name: "JUNIOR QA",
    questions: [
      {
        question: "What is the difference between verification and validation in software testing?",
        criteria: [
          { words: ["verification","review","requirements","design","documents"], label: "Explain verification as checking work products against specifications", weight: 5 },
          { words: ["validation","working software","actual product","user needs","user expectations"], label: "Explain validation as checking that the product meets user needs", weight: 5 },
        ]
      },
      {
        question: "You are asked to test a login page. Which test cases would you prepare?",
        criteria: [
          { words: ["valid credentials","correct password","successful login","valid login"], label: "Test successful login with valid credentials", weight: 2 },
          { words: ["invalid password","wrong password","incorrect credentials","invalid credentials"], label: "Test invalid credentials", weight: 2 },
          { words: ["empty","blank","required field","missing username","missing password"], label: "Test required and empty fields", weight: 2 },
          { words: ["boundary","length","special character","input validation"], label: "Test input boundaries and validation", weight: 2 },
          { words: ["error message","lockout","security","password masking","forgot password"], label: "Check errors and security-related behavior", weight: 2 },
        ]
      },
      {
        question: "You find a bug while testing. What details would you include in your bug report?",
        criteria: [
          { words: ["title","summary"], label: "Give the defect a clear title or summary", weight: 1 },
          { words: ["severity","priority","impact","urgency"], label: "Include defect severity and suggested priority where appropriate", weight: 1 },
          { words: ["steps to reproduce","reproduction steps","steps","reproduce"], label: "Include precise steps to reproduce", weight: 3 },
          { words: ["expected result","expected behavior","expected outcome"], label: "Describe the expected result", weight: 2 },
          { words: ["actual result","actual behavior","observed result"], label: "Describe the actual result", weight: 2 },
          { words: ["screenshot","video","environment","browser","device","evidence"], label: "Include environment details or evidence", weight: 1 },
        ]
      },
      {
        question: "Explain the difference between severity and priority. Can a bug be high severity but low priority?",
        criteria: [
          { words: ["severity","impact","damage","seriousness"], label: "Explain severity in terms of the impact of the defect", weight: 3 },
          { words: ["priority","urgency","fix first","when to fix"], label: "Explain priority in terms of fixing urgency", weight: 3 },
          { words: ["high severity","critical","crash","data loss"], label: "Recognize that a defect can have high severity", weight: 2 },
          { words: ["rare","infrequently","low priority","unused feature","limited users","legacy"], label: "Give a plausible reason why fixing it could be low priority", weight: 2 },
        ]
      },
      {
        question: "What is regression testing, and when should it be performed?",
        criteria: [
          { words: ["regression","existing functionality","previously working","existing features","unaffected features"], label: "Explain that regression tests check previously working functionality", weight: 4 },
          { words: ["change","new feature","bug fix","code update","release","deployment"], label: "Describe when changes or fixes make regression testing important", weight: 3 },
          { words: ["test cases","retest","test suite","automated tests","manual tests","affected areas"], label: "Explain how you would check affected and related functionality", weight: 3 },
        ]
      },
    ]
  },
  mid: {
    name: "MID-LEVEL QA",
    questions: [
      {
        question: "You are given a new feature to test, but the requirements are unclear and the developer has already started implementation. What would you do?",
        criteria: [
          { words: ["clarify","questions","requirements"], label: "Clarify the unclear requirements", weight: 3 },
          { words: ["product owner","stakeholder","business analyst","collaborate with developer","speak with developer","discuss with developer"], label: "Collaborate with relevant stakeholders", weight: 2 },
          { words: ["assumption","document"], label: "Document assumptions and decisions", weight: 1 },
          { words: ["risk","impact","priority"], label: "Identify important product risks", weight: 2 },
          { words: ["test scenario","test cases","test plan","acceptance criteria"], label: "Turn clarified information into test scenarios", weight: 2 },
        ]
      },
      {
        question: "A critical release is scheduled for today, but you only have two hours left and cannot run the entire regression suite. How would you approach testing?",
        criteria: [
          { words: ["risk","risk-based"], label: "Use risk-based prioritisation", weight: 3 },
          { words: ["business critical","critical functionality","core flow","core functionality","critical path"], label: "Test business-critical functionality first", weight: 2 },
          { words: ["changed","change","affected"], label: "Focus on changed and affected areas", weight: 2 },
          { words: ["smoke","sanity"], label: "Run focused smoke/sanity coverage", weight: 1 },
          { words: ["communicate risk","release risk","residual risk","communicate remaining risk","inform stakeholders"], label: "Communicate remaining release risk", weight: 2 },
        ]
      },
      {
        question: "A bug you reported cannot be reproduced by the developer. How would you handle the situation?",
        criteria: [
          { words: ["reproduce","retest"], label: "Reproduce the issue again", weight: 2 },
          { words: ["environment","browser","device","version"], label: "Compare environment and version differences", weight: 2 },
          { words: ["video","screenshot","logs","evidence"], label: "Provide supporting evidence", weight: 2 },
          { words: ["steps","data","test data"], label: "Verify reproduction steps and test data", weight: 2 },
          { words: ["pair with developer","work with developer","collaborate with developer","reproduce together"], label: "Collaborate directly with the developer", weight: 2 },
        ]
      },
      {
        question: "A checkout defect has just been fixed before release. What would you test before approving the build?",
        criteria: [
          { words: ["retest","verify fix"], label: "Retest the original defect", weight: 3 },
          { words: ["regression","related","affected"], label: "Regression test related functionality", weight: 2 },
          { words: ["payment flow","order creation","cart","checkout dependencies"], label: "Cover critical checkout dependencies", weight: 2 },
          { words: ["negative","edge","boundary"], label: "Include negative or edge scenarios", weight: 1 },
          { words: ["release risk","communicate risk","communicate release risk","residual risk"], label: "Assess and communicate release risk", weight: 2 },
        ]
      },
      {
        question: "A production issue is reported by several customers, but you cannot reproduce it in the test environment. How would you investigate?",
        criteria: [
          { words: ["production","logs","monitoring"], label: "Use available production evidence", weight: 2 },
          { words: ["compare environments","environment difference","configuration","test data","production data"], label: "Compare production and test environments", weight: 3 },
          { words: ["customer","steps","conditions"], label: "Gather precise reproduction conditions", weight: 2 },
          { words: ["api","database","network"], label: "Trace the relevant technical layers", weight: 2 },
          { words: ["severity","impact","escalate"], label: "Assess impact and escalate appropriately", weight: 1 },
        ]
      },
    ]
  },
  senior: {
    name: "SENIOR QA",
    questions: [
      {
        question: "Your team is preparing a major release, but a high-impact defect is discovered shortly before deployment. The business wants to proceed. How would you assess the release and make a recommendation?",
        criteria: [
          { words: ["customer impact", "business impact", "security risk", "data loss", "severity", "likelihood"], label: "Assess customer impact, likelihood and the severity of the unresolved risk", weight: 3 },
          { words: ["reproduce", "evidence", "logs", "targeted tests", "scope of impact", "affected flows"], label: "Gather evidence and identify the scope of affected functionality", weight: 2 },
          { words: ["rollback", "feature flag", "disable feature", "workaround", "mitigation", "phased rollout"], label: "Evaluate mitigations and a safe rollback or containment plan", weight: 2 },
          { words: ["go no go", "go/no-go", "recommend delay", "postpone release", "block release", "release recommendation", "stakeholders"], label: "Communicate a clear, risk-based release recommendation to stakeholders", weight: 2 },
          { words: ["document decision", "risk acceptance", "sign off", "accountability", "follow up"], label: "Record the decision, accepted risk and follow-up actions", weight: 1 },
        ]
      },
      {
        question: "A new customer onboarding feature connects several microservices. Requirements are incomplete and there is limited time before launch. How would you design and prioritise a test strategy?",
        criteria: [
          { words: ["clarify requirements", "acceptance criteria", "stakeholder", "assumptions", "expected behavior", "business rules"], label: "Clarify expected behaviour, acceptance criteria and assumptions", weight: 2 },
          { words: ["dependencies", "service boundaries", "architecture", "data flow", "integration points", "system diagram"], label: "Map service dependencies, interfaces and critical data flows", weight: 2 },
          { words: ["risk based", "risk-based", "prioritize critical", "customer impact", "high risk", "critical journeys"], label: "Prioritise coverage around high-risk customer journeys", weight: 2 },
          { words: ["contract tests", "api contracts", "integration tests", "end to end", "end-to-end", "negative scenarios", "failure scenarios"], label: "Cover API contracts, integration, end-to-end and failure scenarios", weight: 3 },
          { words: ["test data", "environment", "observability", "monitoring", "traceability", "testability"], label: "Address test data, environments and observability", weight: 1 },
        ]
      },
      {
        question: "Your automated regression suite fails intermittently in CI and has started blocking reliable releases. How would you diagnose the problem and improve the pipeline?",
        criteria: [
          { words: ["flaky", "flakiness", "reproduce failures", "logs", "trace", "screenshots", "failure patterns"], label: "Distinguish flaky tests from real defects using repeatable evidence", weight: 3 },
          { words: ["test data", "environment", "parallel", "shared state", "network", "external dependency"], label: "Investigate environmental, data and parallel-execution causes", weight: 2 },
          { words: ["deterministic", "explicit waits", "stable locator", "test isolation", "mock services", "cleanup", "fixtures"], label: "Make tests deterministic with reliable waits, isolation and setup", weight: 2 },
          { words: ["quarantine", "quality gate", "ci gate", "pipeline policy", "retry policy", "blocking criteria"], label: "Use a measured quarantine or CI-gating policy without hiding failures", weight: 2 },
          { words: ["flake rate", "failure rate", "trends", "track reliability", "measure stability", "monitor stability"], label: "Track reliability trends to verify improvement", weight: 1 },
        ]
      },
      {
        question: "After a deployment, some customers are charged twice while their order records show only one purchase. The issue crosses payment, order and notification services. How would you lead the QA investigation and help prevent recurrence?",
        criteria: [
          { words: ["containment", "disable payments", "stop retries", "incident response", "escalate", "customer impact", "refund"], label: "Prioritise incident containment and customer or financial impact", weight: 2 },
          { words: ["correlation id", "request id", "distributed tracing", "logs", "transaction id", "timestamps"], label: "Trace requests and transactions across services", weight: 2 },
          { words: ["idempotency", "duplicate request", "retry", "race condition", "concurrency", "timeout"], label: "Investigate idempotency, retries and concurrency failure modes", weight: 3 },
          { words: ["reconciliation", "reconcile", "payment records", "order records", "database", "consistency", "audit trail"], label: "Reconcile payment and order data and identify inconsistencies", weight: 2 },
          { words: ["regression tests", "integration tests", "prevent recurrence", "postmortem", "monitoring alerts", "automated coverage"], label: "Add prevention checks and follow-up testing", weight: 1 },
        ]
      },
      {
        question: "Production defects are increasing even though the team regularly completes its regression suite. As a Senior QA, how would you investigate the trend and improve quality over the next few releases?",
        criteria: [
          { words: ["root cause", "defect analysis", "escape analysis", "patterns", "incident review", "trend analysis"], label: "Investigate escape patterns and underlying causes", weight: 3 },
          { words: ["escaped defects", "defect leakage", "defect escape rate", "production defect rate", "baseline", "quality metrics"], label: "Use meaningful metrics and a baseline rather than test counts alone", weight: 2 },
          { words: ["risk based", "risk-based", "coverage gaps", "test strategy", "exploratory", "integration testing", "critical journeys"], label: "Strengthen high-risk test coverage and the overall strategy", weight: 2 },
          { words: ["shift left", "requirements review", "developer collaboration", "code review", "acceptance criteria", "cross functional"], label: "Improve early feedback and collaboration across the delivery team", weight: 2 },
          { words: ["measure outcomes", "review progress", "monitor trends", "track improvement", "continuous improvement", "next releases"], label: "Measure whether the changes reduce escaped defects over time", weight: 1 },
        ]
      },
    ]
  },
};

let currentArea = "";
let currentQuestions = [];
let currentQuestion = 0;
let totalScore = 0;
let questionScores = [];
function startPractice(area) {
  currentArea = area;
  currentQuestions =
    questionBanks[area].questions;
  currentQuestion = 0;
  totalScore = 0;
  questionScores = [];
  document
    .getElementById("home")
    .classList.add("hidden");
  document
    .getElementById("summary")
    .classList.add("hidden");
  document
    .getElementById("result")
    .classList.add("hidden");
  document
    .getElementById("practice")
    .classList.remove("hidden");
  loadQuestion();
}
function loadQuestion() {
  const item = currentQuestions[currentQuestion];
  const areaName = questionBanks[currentArea].name;
  document
    .getElementById("category")
    .textContent =
    `${areaName} · SCENARIO ${currentQuestion + 1} OF ${currentQuestions.length}`;
  document
    .getElementById("question")
    .textContent =
    item.question;
  document
    .getElementById("answer")
    .value = "";
  const progress = ((currentQuestion + 1) /
    currentQuestions.length) * 100;
  document
    .getElementById("progressText")
    .textContent =
    `Question ${currentQuestion + 1} of ${currentQuestions.length}`;
  document
    .getElementById("progressBar")
    .style.width =
    `${progress}%`;
  document
    .getElementById("answerError")
    .classList.add("hidden");
}
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function wordMatches(answerWord, termWord) {
  /*
 
   Short technical words must match exactly.
 
 
 
   This prevents:
 
   "id" matching "idempotency"
 
   "os" matching another longer word
 
   "db" matching an unrelated word
 
  */
  if (termWord.length <= 3) {
    return answerWord === termWord;
  }
  /*
 
   Longer terms can use a short root.
 
 
 
   Examples:
 
   reproduce / reproducing
 
   duplicate / duplicates
 
   authenticate / authentication
 
  */
  const root = termWord.substring(0, Math.min(5, termWord.length));
  return answerWord.startsWith(root);
}
function matchesConcept(answer, terms) {
  const normalizedAnswer = normalizeText(answer);
  const answerWords = normalizedAnswer.split(" ");
  return terms.some(term => {
    const normalizedTerm = normalizeText(term);
    const termWords = normalizedTerm.split(" ");
    /*
  
     First try an exact phrase match
  
     for multi-word concepts.
  
    */
    if (termWords.length > 1 &&
      normalizedAnswer.includes(normalizedTerm)) {
      return true;
    }
    /*
  
     If wording differs slightly,
  
     check whether all important
  
     words in the phrase appear.
  
    */
    if (termWords.length > 1) {
      return termWords.every(termWord => answerWords.some(answerWord => wordMatches(answerWord, termWord)));
    }
    /*
  
     Single-word concept.
  
    */
    return answerWords.some(answerWord => wordMatches(answerWord, normalizedTerm));
  });
}
/*
 * Shared rule-based safeguard for all QA practice and interview modules.
 * Only affirmative evidence may satisfy an answer criterion.
 * This handles clear refusals, not every possible form of English negation.
 * In particular, it DOES NOT interpret the overall correctness of an answer.
 */
function supportedAnswerClauses(answer) {
  // Normalize contractions before checking explicit rejection of QA actions.
  const expanded = answer
    .replace(/\b(?:won't|wouldn't|shouldn't|couldn't|can't|cannot|don't|doesn't|didn't)\b/gi, "would not")
    .replace(/\b(?:isn't|aren't|wasn't|weren't)\b/gi, "is not");

  // Separate independent decisions so that a negative statement does not
  // erase a later positive action (e.g. "skip regression, but review logs").
  const clauses = expanded.split(
    /[.!?;\n]+|\b(?:but|however|instead|yet)\b|,\s*(?=(?:(?:and|then)\s+)?(?:i|we)\s+(?:would|will|should|must|can|plan|intend)\b)|\s+and\s+(?=(?:not|never|ignore|skip|avoid|refuse)\b)/gi
  );

  const activity = "(?:include|add|focus|look|conduct|execute|inspect|do|apply|coordinate|clarify|confirm|review|document|record|report|assess|analyse|analyze|investigate|check|test|retest|verify|validate|reproduce|replicate|trace|track|measure|monitor|gather|collect|identify|prioriti[sz]e|improve|strengthen|prepare|map|cover|evaluate|communicate|inform|collaborate|reconcile|establish|introduce|use|perform|run|maintain|implement|create|write|fix|address|escalate|prevent|consider|follow|compare|distinguish|make|provide|support|ensure|work|build)";
  const refusedAction = new RegExp(
    "\\b(?:not|never)\\s+(?:(?:even|really|simply|just|necessarily|always)\\s+)?(?:(?:want|need|plan|intend|bother|have)\\s+to\\s+)?" + activity + "\\b", "i"
  );
  // "I would avoid investigating", "ignore quality metrics", "skip testing".
  const rejectAction = /\b(?:ignore|skip|avoid|dismiss|disregard|neglect|refuse|omit|bypass)\b/i;

  return clauses.map(clause => {
    let text = clause.trim();
    if (!text) return "";

    // A refusal to IGNORE or SKIP good QA practice is an affirmative intent.
    // E.g. "I would not ignore customer impact" remains eligible for credit.
    text = text.replace(
      /\b(?:not|never)\s+(?:ignore|skip|avoid|dismiss|disregard|neglect)\b/gi,
      "consider"
    );

    // A decision NOT to ship a risky release is not a rejection of QA work.
    // Preserve it for the Senior release-decision rubric.
    if (/\b(?:not|never)\s+(?:release|deploy|ship|launch|approve|sign\s+off|go\s+live)\b/i.test(text)) {
      return text;
    }

    // "not only review", "not just test" usually introduce more actions.
    // Do not treat those phrases as explicit refusals.
    if (/\bnot\s+(?:only|just|merely|simply)\b/i.test(text)) {
      text = text.replace(/\bnot\s+(?:only|just|merely|simply)\b/gi, "also");
    }

    if (refusedAction.test(text) || rejectAction.test(text)) return "";
    return text;
  }).filter(Boolean);
}

function matchesSupportedConcept(answer, terms) {
  // Preserve the site's existing keyword matching behaviour for ordinary
  // answers, but remove explicitly rejected actions before scoring.
  const supportedAnswer = supportedAnswerClauses(answer).join(". ");
  return matchesConcept(supportedAnswer, terms);
}

function scoreAnswer() {
  const rawAnswer = document
    .getElementById("answer")
    .value
    .trim();
  /*
 
   Do not allow blank answers.
 
  */
  if (rawAnswer === "") {
    document
      .getElementById("answerError")
      .classList.remove("hidden");
    return;
  }
  document
    .getElementById("answerError")
    .classList.add("hidden");
  const criteria = currentQuestions[currentQuestion].criteria;
  let weightedScore = 0;
  const strengths = [];
  const missing = [];
  criteria.forEach(item => {
    const found = matchesSupportedConcept(rawAnswer, item.words);
    if (found) {
      weightedScore +=
        item.weight ?? 2;
      strengths.push(item.label);
    }
    else {
      missing.push(item.label);
    }
  });
  const score = weightedScore;
  totalScore +=
    score;
  questionScores.push(score);
  /*
 
   Update the final-question button.
 
  */
  const nextButton = document.getElementById("nextQuestionButton");
  const isLastQuestion = currentQuestion ===
    currentQuestions.length - 1;
  if (isLastQuestion) {
    nextButton.textContent =
      "View Session Report";
  }
  else {
    nextButton.textContent =
      "Next Question";
  }
  document
    .getElementById("score")
    .textContent =
    score;
  const strengthsList = document.getElementById("strengths");
  const missingList = document.getElementById("missing");
  strengthsList.innerHTML = "";
  missingList.innerHTML = "";
  strengths.forEach(item => {
    const li = document.createElement("li");
    li.textContent =
      item;
    strengthsList.appendChild(li);
  });
  missing.forEach(item => {
    const li = document.createElement("li");
    li.textContent =
      item;
    missingList.appendChild(li);
  });
  /*
 
   Avoid empty feedback cards.
 
  */
  if (strengths.length === 0) {
    const li = document.createElement("li");
    li.textContent =
      "No key investigation areas were identified in this answer.";
    strengthsList.appendChild(li);
  }
  if (missing.length === 0) {
    const li = document.createElement("li");
    li.textContent =
      "Great job — you covered all of the key areas for this scenario.";
    missingList.appendChild(li);
  }
  document
    .getElementById("practice")
    .classList.add("hidden");
  document
    .getElementById("result")
    .classList.remove("hidden");
}
function nextQuestion() {
  currentQuestion++;
  document
    .getElementById("result")
    .classList.add("hidden");
  if (currentQuestion >=
    currentQuestions.length) {
    showSummary();
    return;
  }
  document
    .getElementById("practice")
    .classList.remove("hidden");
  loadQuestion();
}
function showSummary() {
  const maxScore = currentQuestions.length * 10;
  document
    .getElementById("summary")
    .classList.remove("hidden");
  document
    .getElementById("summaryCategory")
    .textContent =
    `${questionBanks[currentArea].name} PRACTICE COMPLETE`;
  document
    .getElementById("finalScore")
    .textContent =
    totalScore;
  document
    .getElementById("maxScore")
    .textContent =
    maxScore;
  const percentage = (totalScore / maxScore) * 100;
  const scoreCard = document.getElementById("summaryScoreCard");
  scoreCard.classList.remove("score-low", "score-medium", "score-high");
  if (percentage >= 80) {
    scoreCard.classList.add("score-high");
  }
  else if (percentage >= 40) {
    scoreCard.classList.add("score-medium");
  }
  else {
    scoreCard.classList.add("score-low");
  }
  let title = "";
  let message = "";
  if (percentage >= 80) {
    title =
      "Strong QA reasoning";
    message =
      "You identified most of the important testing and investigation areas. Keep practicing how you communicate your reasoning clearly.";
  }
  else if (percentage >= 60) {
    title =
      "Good foundation";
    message =
      "You have solid QA instincts, but some investigation areas should be identified more consistently.";
  }
  else if (percentage >= 40) {
    title =
      "Developing";
    message =
      "You are identifying useful testing ideas, but your answers need more technical depth and structure.";
  }
  else {
    title =
      "More practice recommended";
    message =
      "Focus on building a repeatable investigation process: understand the failure, gather evidence, trace the relevant layers and assess risk.";
  }
  document
    .getElementById("performanceTitle")
    .textContent =
    title;
  document
    .getElementById("performanceMessage")
    .textContent =
    message;
  const breakdown = document.getElementById("scoreBreakdown");
  breakdown.innerHTML = "";
  questionScores.forEach((score, index) => {
    const li = document.createElement("li");
    li.textContent =
      `Scenario ${index + 1}: ${score}/10`;
    breakdown.appendChild(li);
  });
}
function restartPractice() {
  startPractice(currentArea);
}
/*

 MOCK INTERVIEW

*/
function showInterviewSetup() {
  document
    .getElementById("home")
    .classList.add("hidden");
  document
    .getElementById("interviewSetup")
    .classList.remove("hidden");
}
let currentInterviewLevel = "";
let currentInterviewQuestions = [];
let currentInterviewQuestion = 0;
let interviewTotalScore = 0;
let interviewQuestionScores = [];
function selectInterviewLevel(level) {
  currentInterviewLevel =
    level;
  currentInterviewQuestions =
    interviewBanks[level].questions;
  currentInterviewQuestion = 0;
  interviewTotalScore = 0;
  interviewQuestionScores = [];
  document
    .getElementById("interviewSetup")
    .classList.add("hidden");
  document
    .getElementById("interviewSummary")
    .classList.add("hidden");
  document
    .getElementById("interviewFeedback")
    .classList.add("hidden");
  document
    .getElementById("interview")
    .classList.remove("hidden");
  loadInterviewQuestion();
}
function loadInterviewQuestion() {
  const item = currentInterviewQuestions[currentInterviewQuestion];
  document
    .getElementById("interviewLevelLabel")
    .textContent =
    `${interviewBanks[currentInterviewLevel].name} MOCK INTERVIEW`;
  document
    .getElementById("interviewProgress")
    .textContent =
    `Interview Question ${currentInterviewQuestion + 1} of ${currentInterviewQuestions.length}`;
  const progressPercentage = ((currentInterviewQuestion +
    1) /
    currentInterviewQuestions.length) * 100;
  document
    .getElementById("interviewProgressBar")
    .style.width =
    `${progressPercentage}%`;
  document
    .getElementById("interviewQuestion")
    .textContent =
    item.question;
  document
    .getElementById("interviewAnswer")
    .value = "";
  document
    .getElementById("interviewError")
    .classList.add("hidden");
}
/*
 * Senior QA Q1: lightweight, transparent partial-credit rubric.
 * This does not understand free-form language like an AI evaluator.
 * It deliberately rewards a general impact check only minimally and
 * reserves full marks for multiple relevant actions and details.
 */
/*
 * Exclude statements that explicitly reject essential QA actions.
 * This is a limited safeguard, not a general natural-language evaluator.
 * Positive release safeguards (for example, "do not release") remain valid.
 */
function seniorReleaseAffirmativeText(answer) {
  const statements = answer
    .replace(/\b(?:wouldn't|shouldn't|won't|don't|didn't|can't)\b/gi, "would not")
    .split(/[.!?;\n]+|,\s*(?=(?:and\s+)?(?:i|we)\s+(?:would|will|should|must)\b)|\b(?:however|instead)\b/gi);

  return statements.filter(statement => {
    const text = normalizeText(statement);
    // "Do not ignore the risk" is a positive intent. Keep evaluating
    // the rest of the statement in case it also rejects another action.
    const checked = text.replace(
      /\b(?:not|never)\s+(?:ignore|skip|avoid|dismiss|disregard|neglect)\b/g,
      "consider"
    );
    // Reject explicit statements such as "I would not gather evidence".
    const refusedAction = /\b(?:not|never|without)\s+(?:(?:need|have|want|plan|bother)\s+to\s+)?(?:gather|collect|review|assess|check|evaluate|verify|reproduce|replicate|investigate|identify|consider|analyse|analyze|mitigate|plan|prepare|communicate|inform|document|record|report|escalate|make\s+(?:a\s+)?(?:release\s+)?recommendation)\b/;
    if (refusedAction.test(checked)) return false;
    // Also reject "ignore the impact", "avoid mitigation", etc.
    const rejectResponsibilities = /\b(?:ignore|skip|avoid|disregard|dismiss|neglect)\s+(?:(?:the|any|all|our|a|an)\s+)?(?:customer|business|financial|release|risk|impact|severity|likelihood|evidence|logs|affected|scope|mitigation|rollback|fallback|workaround|contingency|documentation|stakeholders|communication|follow\s+up|recommendation)\b/;
    return !rejectResponsibilities.test(checked);
  }).join(". ");
}

function scoreSeniorReleaseDecision(answer) {
  const text = normalizeText(seniorReleaseAffirmativeText(answer));
  const has = (...phrases) => phrases.some(phrase => {
    const term = normalizeText(phrase);
    return (" " + text + " ").includes(" " + term + " ");
  });

  const strengths = [];
  const missing = [];
  let score = 0;

  function add(points, fullPoints, partialFeedback, fullFeedback) {
    score += points;
    if (points === fullPoints) {
      strengths.push(fullFeedback);
    } else {
      if (points > 0) strengths.push(partialFeedback);
      missing.push(fullFeedback);
    }
  }

  // 1. Risk assessment (3 points maximum)
  const examines = has("assess", "check", "evaluate", "review", "analyse", "analyze", "consider", "investigate", "identify", "determine", "estimate");
  const impact = has("impact", "risk", "severity", "likelihood", "probability", "consequences");
  const releaseContext = has("release", "deployment", "deploy", "rollout", "defect", "bug", "issue", "change", "changes", "production");
  const specificRisk = has("customer impact", "business impact", "financial impact", "security risk", "data loss", "severity", "likelihood", "probability", "revenue", "privacy", "payment impact");
  const riskPoints = examines && specificRisk && releaseContext ? 3
    : (specificRisk && (examines || releaseContext)) ? 2
    : (examines && impact && releaseContext) || specificRisk ? 1 : 0;
  add(riskPoints, 3,
    "You considered release impact; specify customer/business risk, severity and likelihood.",
    "Assess customer/business impact, severity and likelihood of the unresolved defect.");

  // 2. Technical evidence and affected scope (2 points maximum)
  const evidence = has("reproduce", "replicate", "retest", "logs", "traces", "trace", "test results", "evidence", "verify", "investigate", "test the fix");
  const scope = has("affected users", "affected flows", "affected services", "affected functionality", "scope", "which users", "reproduction steps", "steps to reproduce", "impacted functionality");
  add(evidence && scope ? 2 : evidence || scope ? 1 : 0, 2,
    "You mentioned investigation or scope; explain the evidence and affected functionality.",
    "Gather reproduction evidence and identify affected users or functionality.");

  // 3. Mitigation and safe fallback (2 points maximum)
  const fallback = has("rollback", "roll back", "revert", "feature flag", "disable feature", "disable the feature", "stop rollout", "turn off the feature");
  const mitigation = has("workaround", "mitigation", "mitigate", "phased rollout", "canary release", "contingency plan", "reduce exposure", "fix before release");
  add(fallback && mitigation ? 2 : fallback || mitigation ? 1 : 0, 2,
    "You mentioned a fallback or mitigation; pair it with a safe release plan.",
    "Evaluate mitigations alongside a safe rollback or containment plan.");

  // 4. Decision and communication (2 points maximum)
  const decision = has("recommend", "postpone", "delay release", "delay the release", "hold release", "hold the release", "block release", "stop deployment", "do not release", "not release", "not deploy", "no go", "proceed only", "release decision");
  const communication = has("stakeholders", "stakeholder", "product owner", "release manager", "management", "business team", "engineering lead", "decision makers", "communicate", "inform the team", "escalate to");
  add(decision && communication ? 2 : decision || communication ? 1 : 0, 2,
    "You mentioned a release decision or communication; connect both with a clear recommendation.",
    "Give a clear release recommendation and communicate it to decision-makers.");

  // 5. Documented decision and accountability (1 point maximum)
  const documented = has("document the decision", "record the decision", "document risk", "record risk", "risk acceptance", "accepted risk", "sign off", "signoff", "follow up actions", "follow up plan", "action items");
  add(documented ? 1 : 0, 1, "", "Document the decision, accepted risk and follow-up actions.");

  return { score, strengths, missing };
}

function submitInterviewAnswer() {
  const rawAnswer = document
    .getElementById("interviewAnswer")
    .value
    .trim();
  if (rawAnswer === "") {
    document
      .getElementById("interviewError")
      .classList.remove("hidden");
    return;
  }
  document
    .getElementById("interviewError")
    .classList.add("hidden");
  const criteria = currentInterviewQuestions[currentInterviewQuestion].criteria;
  let weightedScore = 0;
  let strengths = [];
  let missing = [];

  // Senior Q1 keeps its dedicated partial-credit rubric.
  // Every other interview criterion uses shared negation-aware matching.
  if (currentInterviewLevel === "senior" && currentInterviewQuestion === 0) {
    const result = scoreSeniorReleaseDecision(rawAnswer);
    weightedScore = result.score;
    strengths = result.strengths;
    missing = result.missing;
  } else {
    criteria.forEach(item => {
      const found = matchesSupportedConcept(rawAnswer, item.words);
      if (found) {
        weightedScore += item.weight ?? 2;
        strengths.push(item.label);
      } else {
        missing.push(item.label);
      }
    });
  }
  const score = weightedScore;
  interviewTotalScore +=
    score;
  interviewQuestionScores.push(score);
  /*
 
   Change the final button
 
   to View Interview Scorecard.
 
  */
  const nextButton = document.getElementById("interviewNextButton");
  const isLastQuestion = currentInterviewQuestion ===
    currentInterviewQuestions.length -
      1;
  if (isLastQuestion) {
    nextButton.textContent =
      "View Interview Scorecard";
  }
  else {
    nextButton.textContent =
      "Next Interview Question";
  }
  document
    .getElementById("interviewScore")
    .textContent =
    score;
  const strengthsList = document.getElementById("interviewStrengths");
  const missingList = document.getElementById("interviewMissing");
  strengthsList.innerHTML = "";
  missingList.innerHTML = "";
  strengths.forEach(item => {
    const li = document.createElement("li");
    li.textContent =
      item;
    strengthsList.appendChild(li);
  });
  missing.forEach(item => {
    const li = document.createElement("li");
    li.textContent =
      item;
    missingList.appendChild(li);
  });
  /*
 
   Avoid empty feedback cards.
 
  */
  if (strengths.length === 0) {
    const li = document.createElement("li");
    li.textContent =
      "No key interview points were identified in this answer.";
    strengthsList.appendChild(li);
  }
  if (missing.length === 0) {
    const li = document.createElement("li");
    li.textContent =
      "Excellent — your answer covered all of the key points we were looking for.";
    missingList.appendChild(li);
  }
  document
    .getElementById("interview")
    .classList.add("hidden");
  document
    .getElementById("interviewFeedback")
    .classList.remove("hidden");
}
function nextInterviewQuestion() {
  currentInterviewQuestion++;
  document
    .getElementById("interviewFeedback")
    .classList.add("hidden");
  if (currentInterviewQuestion >=
    currentInterviewQuestions.length) {
    showInterviewSummary();
    return;
  }
  document
    .getElementById("interview")
    .classList.remove("hidden");
  loadInterviewQuestion();
}
function showInterviewSummary() {
  document
    .getElementById("interviewSummary")
    .classList.remove("hidden");
  document
    .getElementById("interviewFinalScore")
    .textContent =
    interviewTotalScore;
  /*
 
   Calculate maximum score dynamically
 
   instead of hard-coding 50.
 
  */
  const maxInterviewScore = currentInterviewQuestions.length *
    10;
  document
    .getElementById("interviewMaxScore")
    .textContent =
    maxInterviewScore;
  document
    .getElementById("interviewSummaryCategory")
    .textContent =
    `${interviewBanks[currentInterviewLevel].name} MOCK INTERVIEW COMPLETE`;
  const percentage = (interviewTotalScore /
    maxInterviewScore) * 100;
  const scoreCard = document.getElementById("interviewSummaryScoreCard");
  scoreCard.classList.remove("score-low", "score-medium", "score-high");
  if (percentage >= 80) {
    scoreCard.classList.add("score-high");
  }
  else if (percentage >= 40) {
    scoreCard.classList.add("score-medium");
  }
  else {
    scoreCard.classList.add("score-low");
  }
  let title = "";
  let message = "";
  if (percentage >= 80) {
    title =
      "Interview ready";
    message =
      "Strong performance. Your answers consistently demonstrate structured QA reasoning, risk awareness and practical investigation skills.";
  }
  else if (percentage >= 60) {
    title =
      "Good interview foundation";
    message =
      "You demonstrate solid QA thinking. Continue improving the depth, structure and evidence behind your answers.";
  }
  else if (percentage >= 40) {
    title =
      "Developing interview confidence";
    message =
      "You have useful QA instincts, but your answers need more structure, technical depth and risk-based reasoning.";
  }
  else {
    title =
      "More interview practice recommended";
    message =
      "Focus on explaining your reasoning step by step, identifying risk, gathering evidence and communicating clearly with the team.";
  }
  // Tailor interview feedback to the selected experience level.
  // Keep the existing Mid-Level messages unchanged.
  if (currentInterviewLevel === "junior") {
    if (percentage >= 80) {
      title = "Excellent Junior QA foundation";
      message = "Excellent understanding of Junior QA concepts. Continue building your practical testing skills.";
    }
    else if (percentage >= 60) {
      title = "Good Junior QA foundation";
      message = "You understand several QA fundamentals. Improve your answers with practical examples, clear test cases and bug reporting details.";
    }
    else if (percentage >= 40) {
      title = "Developing your QA skills";
      message = "You are building a foundation in software testing. Focus on test case design, bug reporting and explaining QA concepts clearly.";
    }
    else {
      title = "Keep building your QA foundations";
      message = "Focus on verification and validation, login testing, bug reporting, severity versus priority and regression testing. Practise explaining each concept using simple examples.";
    }
  }
  else if (currentInterviewLevel === "senior") {
    if (percentage >= 80) {
      title = "Strong senior-level QA reasoning";
      message = "Your answers cover release risk, cross-system investigation and strategic quality decisions. Continue strengthening your examples with measurable outcomes and trade-offs.";
    }
    else if (percentage >= 60) {
      title = "Good senior QA foundation";
      message = "You demonstrate several senior-level approaches. Strengthen your decision-making by explaining evidence, alternatives, stakeholder communication and measurable impact.";
    }
    else if (percentage >= 40) {
      title = "Developing senior QA judgement";
      message = "Build more depth in risk-based release recommendations, integration strategy, incident analysis, reliable automation and quality improvement metrics.";
    }
    else {
      title = "More senior QA practice recommended";
      message = "Focus on assessing business and customer risk, making evidence-based release decisions, troubleshooting cross-service incidents and measuring quality improvements.";
    }
  }
  document
    .getElementById("interviewPerformanceTitle")
    .textContent =
    title;
  document
    .getElementById("interviewPerformanceMessage")
    .textContent =
    message;
  const breakdown = document.getElementById("interviewScoreBreakdown");
  breakdown.innerHTML = "";
  interviewQuestionScores.forEach((score, index) => {
    const li = document.createElement("li");
    li.textContent =
      `Interview Question ${index + 1}: ${score}/10`;
    breakdown.appendChild(li);
  });
}
function restartInterview() {
  selectInterviewLevel(currentInterviewLevel);
}
function goHome() {
  document
    .getElementById("summary")
    .classList.add("hidden");
  document
    .getElementById("result")
    .classList.add("hidden");
  document
    .getElementById("practice")
    .classList.add("hidden");
  document
    .getElementById("interview")
    .classList.add("hidden");
  document
    .getElementById("interviewFeedback")
    .classList.add("hidden");
  document
    .getElementById("interviewSummary")
    .classList.add("hidden");
  document
    .getElementById("interviewSetup")
    .classList.add("hidden");
  document
    .getElementById("home")
    .classList.remove("hidden");
}
