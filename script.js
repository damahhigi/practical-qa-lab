const questionBanks = {

  manual: {
    name: "MANUAL QA",

    questions: [
      {
        question:
          "A customer successfully completes checkout, but the order does not appear in Order History. How would you investigate this issue?",

        criteria: [
        {
          words: ["reproduce", "reproduction"],
          label: "Attempt to reproduce the issue",
    weight: 2
  },
  {
    words: ["api", "request", "response"],
    label: "Check the API request and response",
    weight: 3
  },
  {
    words: ["database", "db", "stored", "persistence"],
    label: "Verify whether the order was stored",
    weight: 3
  },
  {
    words: ["logs", "logging", "order id", "transaction"],
    label: "Trace the transaction using logs or identifiers",
    weight: 1
  },
  {
    words: ["cache", "async", "queue", "delay", "eventual"],
    label: "Consider caching or asynchronous processing",
    weight: 1
  }
]
      },

      {
        question:
          "Login works correctly in Chrome on desktop, but users cannot log in using Safari on an iPhone. How would you investigate?",

        criteria: [
  {
    words: ["reproduce", "iphone", "safari", "device"],
    label: "Reproduce under the affected device/browser conditions",
    weight: 3
  },
  {
    words: ["version", "browser", "os", "ios"],
    label: "Check browser and operating-system versions",
    weight: 1
  },
  {
    words: ["network", "api", "request", "response"],
    label: "Compare network/API behavior",
    weight: 3
  },
  {
    words: ["cookie", "session", "storage", "token"],
    label: "Investigate cookies, sessions, storage or authentication tokens",
    weight: 2
  },
  {
    words: ["logs", "console", "error", "devtools"],
    label: "Inspect errors, logs or debugging information",
    weight: 1
  }
]
      },

      {
        question:
          "A product search sometimes shows the same product twice in the results. How would you investigate the defect?",

        criteria: [
  {
    words: ["reproduce", "search term", "query"],
    label: "Identify reproducible search conditions",
    weight: 2
  },
  {
    words: ["api", "response", "payload"],
    label: "Check whether duplicates come from the API",
    weight: 3
  },
  {
    words: ["database", "db", "duplicate"],
    label: "Check for duplicate source records",
    weight: 2
  },
  {
    words: ["pagination", "page", "cache"],
    label: "Investigate pagination or caching behavior",
    weight: 2
  },
  {
    words: ["frontend", "ui", "render", "display"],
    label: "Check whether the UI renders records more than once",
    weight: 1
  }
]
      },

      {
        question:
          "A customer reports that their card was charged twice, but only one order was created. What would you do?",

        criteria: [
  {
    words: ["severity", "critical", "high", "escalate"],
    label: "Recognize the high business impact",
    weight: 2
  },
  {
    words: ["payment", "gateway", "processor", "transaction"],
    label: "Investigate payment-provider transactions",
    weight: 2
  },
  {
    words: ["idempotency", "duplicate request", "retry"],
    label: "Check duplicate requests, retries or idempotency",
    weight: 3
  },
  {
    words: ["database", "db", "order"],
    label: "Compare payment and order records",
    weight: 2
  },
  {
    words: ["logs", "timestamp", "request id", "evidence"],
    label: "Collect traceable evidence",
    weight: 1
  }
]
      },

      {
        question:
          "A user updates their profile and sees a success message, but after refreshing the page the old information returns. How would you investigate?",

        criteria: [
  {
    words: ["api", "request", "response", "status"],
    label: "Inspect the update API request and response",
    weight: 3
  },
  {
    words: ["database", "db", "persist", "saved"],
    label: "Verify whether the new data was persisted",
    weight: 3
  },
  {
    words: ["cache", "cached", "stale"],
    label: "Consider stale or cached data",
    weight: 2
  },
  {
    words: ["frontend", "state", "ui"],
    label: "Check temporary frontend state",
    weight: 1
  },
  {
    words: ["logs", "error", "backend"],
    label: "Inspect backend errors or logs",
    weight: 1
  }
]
      }
    ]
  },


  api: {
    name: "API TESTING",

    questions: [
      {
        question:
          "A POST /orders request returns 201 Created, but the new order cannot be retrieved using GET /orders/{id}. How would you investigate?",

        criteria: [
  {
    words: ["response", "body", "order id", "id"],
    label: "Inspect the POST response and generated order ID",
    weight: 2
  },
  {
    words: ["get", "endpoint", "request"],
    label: "Validate the follow-up GET request",
    weight: 2
  },
  {
    words: ["database", "db", "persist", "stored"],
    label: "Verify whether the order was persisted",
    weight: 3
  },
  {
    words: ["logs", "backend", "service"],
    label: "Inspect backend/service logs",
    weight: 1
  },
  {
    words: ["async", "delay", "eventual", "queue"],
    label: "Consider asynchronous or eventual processing",
    weight: 2
  }
]
      },

      {
        question:
          "An API should reject requests without authentication, but GET /customers returns customer data without a token. What would you test next?",

        criteria: [
  {
    words: ["401", "unauthorized", "authentication"],
    label: "Verify expected authentication behavior",
    weight: 3
  },
  {
    words: ["token", "missing", "invalid", "expired"],
    label: "Test missing, invalid and expired tokens",
    weight: 2
  },
  {
    words: ["authorization", "role", "permission", "403"],
    label: "Check authorization and access controls",
    weight: 2
  },
  {
    words: ["sensitive", "data", "privacy", "security"],
    label: "Recognize the data/security impact",
    weight: 2
  },
  {
    words: ["report", "escalate", "severity", "critical"],
    label: "Escalate and report the security defect appropriately",
    weight: 1
  }
]
      },

      {
        question:
          "GET /products?page=2 sometimes returns products that were already returned on page 1. How would you investigate?",

        criteria: [
  {
    words: ["pagination", "page", "limit", "offset"],
    label: "Inspect pagination parameters",
    weight: 3
  },
  {
    words: ["sort", "order", "stable"],
    label: "Check deterministic sorting",
    weight: 2
  },
  {
    words: ["duplicate", "id", "unique"],
    label: "Compare unique product identifiers",
    weight: 2
  },
  {
    words: ["data change", "created", "updated", "concurrent"],
    label: "Consider data changing between requests",
    weight: 2
  },
  {
    words: ["response", "api", "backend"],
    label: "Compare raw API responses",
    weight: 1
  }
]
      },

      {
        question:
          "A PUT /users/42 request returns 200 OK, but one field in the response still contains the old value. What would you check?",

        criteria: [
  {
    words: ["request body", "payload", "field"],
    label: "Verify the request payload",
    weight: 2
  },
  {
    words: ["response body", "response"],
    label: "Inspect the complete response body",
    weight: 2
  },
  {
    words: ["database", "db", "persist"],
    label: "Verify persisted database values",
    weight: 3
  },
  {
    words: ["put", "patch", "contract", "semantics"],
    label: "Confirm endpoint update semantics",
    weight: 2
  },
  {
    words: ["cache", "mapping", "serialization"],
    label: "Investigate caching or response mapping",
    weight: 1
  }
]
      },

      {
        question:
          "POST /payments occasionally creates two payment records when the client retries after a timeout. How would you test and investigate this?",

        criteria: [
  {
    words: ["idempotency", "idempotency key"],
    label: "Check idempotency protection",
    weight: 3
  },
  {
    words: ["retry", "timeout", "duplicate"],
    label: "Reproduce timeout/retry behavior",
    weight: 2
  },
  {
    words: ["database", "records", "transaction"],
    label: "Compare stored payment records",
    weight: 2
  },
  {
    words: ["logs", "request id", "trace"],
    label: "Trace duplicate requests through logs",
    weight: 1
  },
  {
    words: ["financial", "severity", "critical", "risk"],
    label: "Recognize the financial/business risk",
    weight: 2
  }
]
      }
    ]
  },
 sql: {
    name: "SQL TESTING",

    questions: [
      {
      question:
        "A customer says their order is missing from the application. How would you use SQL to verify whether the order exists in the database?",

      criteria: [
  {
    words: ["select", "query"],
    label: "Use a SELECT query to retrieve the record",
    weight: 2
  },
  {
    words: ["where", "order id", "customer id"],
    label: "Filter using a reliable identifier",
    weight: 3
  },
  {
    words: ["orders", "table"],
    label: "Identify the relevant table",
    weight: 1
  },
  {
    words: ["status", "created", "timestamp"],
    label: "Validate important order fields",
    weight: 2
  },
  {
    words: ["api", "ui", "compare"],
    label: "Compare database data with application behavior",
    weight: 2
  }
]
    },

    {
      question:
        "You suspect the users table contains duplicate email addresses. How would you investigate using SQL?",

      criteria: [
  {
    words: ["group by"],
    label: "Group records by email",
    weight: 2
  },
  {
    words: ["count", "count(*)"],
    label: "Count occurrences",
    weight: 2
  },
  {
    words: ["having"],
    label: "Filter groups with more than one record",
    weight: 3
  },
  {
    words: ["email"],
    label: "Use email as the duplicate key",
    weight: 1
  },
  {
    words: ["duplicate", "unique", "constraint"],
    label: "Consider whether uniqueness should be enforced",
    weight: 2
  }
]
    },

    {
      question:
        "The UI displays an order total of $120, but you suspect the stored amount is different. How would you validate it?",

      criteria: [
  {
    words: ["select", "query"],
    label: "Query the relevant order data",
    weight: 2
  },
  {
    words: ["order id", "where"],
    label: "Locate the specific order",
    weight: 2
  },
  {
    words: ["total", "amount", "price"],
    label: "Check the stored monetary value",
    weight: 2
  },
  {
    words: ["items", "sum", "calculate"],
    label: "Validate the total against underlying items",
    weight: 3
  },
  {
    words: ["ui", "api", "compare"],
    label: "Compare values across application layers",
    weight: 1
  }
]
    },

    {
      question:
        "You need to find customers who have placed orders. How would you retrieve customer details together with their order information?",

      criteria: [
  {
    words: ["join", "inner join"],
    label: "Use a JOIN between related tables",
    weight: 3
  },
  {
    words: ["customers", "users"],
    label: "Identify the customer table",
    weight: 1
  },
  {
    words: ["orders"],
    label: "Identify the orders table",
    weight: 1
  },
  {
    words: ["customer id", "user id", "foreign key"],
    label: "Join using the relationship key",
    weight: 3
  },
  {
    words: ["select"],
    label: "Select the fields needed for validation",
    weight: 2
  }
]
    },

    {
      question:
        "A user's profile update shows success, but the database still contains the old phone number. What would you investigate?",

      criteria: [
  {
    words: ["select", "query"],
    label: "Query the user's stored record",
    weight: 2
  },
  {
    words: ["user id", "email", "where"],
    label: "Locate the correct user reliably",
    weight: 2
  },
  {
    words: ["transaction", "commit", "rollback"],
    label: "Consider transaction or commit behavior",
    weight: 3
  },
  {
    words: ["api", "backend", "logs"],
    label: "Investigate the backend/API update process",
    weight: 2
  },
  {
    words: ["timestamp", "updated_at", "audit"],
    label: "Check update timestamps or audit information",
    weight: 1
  }
]
    }
  ]
}
};

const interviewBanks = {

  mid: {
    name: "MID-LEVEL QA",

    questions: [

      {
        question:
          "You are given a new feature to test, but the requirements are unclear and the developer has already started implementation. What would you do?",

        criteria: [
  {
    words: ["clarify", "questions", "requirements"],
    label: "Clarify the unclear requirements",
    weight: 3
  },
  {
    words: ["product", "developer", "stakeholder", "ba"],
    label: "Collaborate with relevant stakeholders",
    weight: 2
  },
  {
    words: ["assumption", "document"],
    label: "Document assumptions and decisions",
    weight: 1
  },
  {
    words: ["risk", "impact", "priority"],
    label: "Identify important product risks",
    weight: 2
  },
  {
  words: [
    "test scenario",
    "test cases",
    "test plan",
    "acceptance criteria"
  ],
  label: "Turn clarified information into test scenarios",
  weight: 2
}
]
      },

      {
        question:
          "A critical release is scheduled for today, but you only have two hours left and cannot run the entire regression suite. How would you approach testing?",

        criteria: [
  {
    words: ["risk", "risk-based"],
    label: "Use risk-based prioritisation",
    weight: 3
  },
  {
    words: ["critical", "core", "business"],
    label: "Test business-critical functionality first",
    weight: 2
  },
  {
    words: ["changed", "change", "affected"],
    label: "Focus on changed and affected areas",
    weight: 2
  },
  {
    words: ["smoke", "sanity"],
    label: "Run focused smoke/sanity coverage",
    weight: 1
  },
  {
  words: [
    "communicate risk",
    "release risk",
    "residual risk",
    "communicate remaining risk",
    "inform stakeholders"
  ],
  label: "Communicate remaining release risk",
  weight: 2
}
]
      },

      {
        question:
          "A bug you reported cannot be reproduced by the developer. How would you handle the situation?",

        criteria: [
  {
    words: ["reproduce", "retest"],
    label: "Reproduce the issue again",
    weight: 2
  },
  {
    words: ["environment", "browser", "device", "version"],
    label: "Compare environment and version differences",
    weight: 2
  },
  {
    words: ["video", "screenshot", "logs", "evidence"],
    label: "Provide supporting evidence",
    weight: 2
  },
  {
    words: ["steps", "data", "test data"],
    label: "Verify reproduction steps and test data",
    weight: 2
  },
  {
    words: ["developer", "pair", "together"],
    label: "Collaborate directly with the developer",
    weight: 2
  }
]
      },

      {
        question:
          "A checkout defect has just been fixed before release. What would you test before approving the build?",

        criteria: [
  {
    words: ["retest", "verify fix"],
    label: "Retest the original defect",
    weight: 3
  },
  {
    words: ["regression", "related", "affected"],
    label: "Regression test related functionality",
    weight: 2
  },
  {
    words: ["payment", "order", "cart"],
    label: "Cover critical checkout dependencies",
    weight: 2
  },
  {
    words: ["negative", "edge", "boundary"],
    label: "Include negative or edge scenarios",
    weight: 1
  },
  {
    words: ["risk", "release", "communicate"],
    label: "Assess and communicate release risk",
    weight: 2
  }
]
      },

      {
        question:
          "A production issue is reported by several customers, but you cannot reproduce it in the test environment. How would you investigate?",

        criteria: [
  {
    words: ["production", "logs", "monitoring"],
    label: "Use available production evidence",
    weight: 2
  },
  {
    words: ["environment", "configuration", "data"],
    label: "Compare production and test environments",
    weight: 3
  },
  {
    words: ["customer", "steps", "conditions"],
    label: "Gather precise reproduction conditions",
    weight: 2
  },
  {
    words: ["api", "database", "network"],
    label: "Trace the relevant technical layers",
    weight: 2
  },
  {
    words: ["severity", "impact", "escalate"],
    label: "Assess impact and escalate appropriately",
    weight: 1
  }
]
      }

    ]
  }

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
    .getElementById("practice")
    .classList.remove("hidden");

  loadQuestion();
}


function loadQuestion() {

  const item =
    currentQuestions[currentQuestion];

  const areaName =
    questionBanks[currentArea].name;


  document.getElementById("category").textContent =
    `${areaName} · SCENARIO ${currentQuestion + 1} OF ${currentQuestions.length}`;


  document.getElementById("question").textContent =
    item.question;


  document.getElementById("answer").value = "";

  const progress =
  ((currentQuestion + 1) / currentQuestions.length) * 100;

  document.getElementById("progressText").textContent =
  `Question ${currentQuestion + 1} of ${currentQuestions.length}`;

  document.getElementById("progressBar").style.width =
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

  // Short technical terms must match exactly.
  // Prevents "id" matching "idempotency",
  // "os" matching another longer word, etc.
  if (termWord.length <= 3) {
    return answerWord === termWord;
  }


  // Longer words can use a short root
  // to support variations such as:
  // reproduce / reproducing
  // authenticate / authentication
  // duplicate / duplicates
  const root =
    termWord.substring(
      0,
      Math.min(5, termWord.length)
    );

  return answerWord.startsWith(root);
}


function matchesConcept(answer, terms) {

  const normalizedAnswer =
    normalizeText(answer);

  const answerWords =
    normalizedAnswer.split(" ");


  return terms.some(term => {

    const normalizedTerm =
      normalizeText(term);

    const termWords =
      normalizedTerm.split(" ");


    // Multi-word phrases:
    // first check the actual phrase.
    if (
      termWords.length > 1 &&
      normalizedAnswer.includes(normalizedTerm)
    ) {
      return true;
    }


    // If the phrase is written differently,
    // check that each important word exists.
    if (termWords.length > 1) {

      return termWords.every(termWord =>
        answerWords.some(answerWord =>
          wordMatches(
            answerWord,
            termWord
          )
        )
      );

    }


    // Single-word concept.
    return answerWords.some(answerWord =>
      wordMatches(
        answerWord,
        normalizedTerm
      )
    );

  });

}

function scoreAnswer() {

  const rawAnswer = document
    .getElementById("answer")
    .value
    .trim();


  // Do not allow an empty answer
  if (rawAnswer === "") {

    document
      .getElementById("answerError")
      .classList.remove("hidden");

    return;
  }


  // Hide the error after the user types an answer
  document
    .getElementById("answerError")
    .classList.add("hidden");


  const answer =
    rawAnswer.toLowerCase();


  const criteria =
    currentQuestions[currentQuestion].criteria;


  let weightedScore = 0;

  const strengths = [];
  const missing = [];


  criteria.forEach(item => {

    const found =
      matchesConcept(
        answer,
        item.words
   );


    if (found) {

      weightedScore += item.weight ?? 2;
      strengths.push(item.label);

    } else {

      missing.push(item.label);

    }

  });


  const score = weightedScore;


  totalScore += score;
  questionScores.push(score);


   const nextButton =
  document.getElementById("nextQuestionButton");

const isLastQuestion =
  currentQuestion ===
  currentQuestions.length - 1;

if (isLastQuestion) {
  nextButton.textContent = "View Session Report";
} else {
  nextButton.textContent = "Next Question";
}  


  document.getElementById("score").textContent =
    score;


  const strengthsList =
    document.getElementById("strengths");

  const missingList =
    document.getElementById("missing");


  strengthsList.innerHTML = "";
  missingList.innerHTML = "";


  strengths.forEach(item => {

    const li =
      document.createElement("li");

    li.textContent = item;

    strengthsList.appendChild(li);

  });


  missing.forEach(item => {

    const li =
      document.createElement("li");

    li.textContent = item;

    missingList.appendChild(li);

  });

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


  if (
    currentQuestion >=
    currentQuestions.length
  ) {

    showSummary();
    return;

  }


  document
    .getElementById("practice")
    .classList.remove("hidden");


  loadQuestion();
}


function showSummary() {

  const maxScore =
    currentQuestions.length * 10;


  document
    .getElementById("summary")
    .classList.remove("hidden");


  document.getElementById("summaryCategory").textContent =
    `${questionBanks[currentArea].name} PRACTICE COMPLETE`;


  document.getElementById("finalScore").textContent =
    totalScore;


  document.getElementById("maxScore").textContent =
    maxScore;


  const percentage =
    (totalScore / maxScore) * 100;

  const scoreCard =
  document.getElementById("summaryScoreCard");

scoreCard.classList.remove(
  "score-low",
  "score-medium",
  "score-high"
);

if (percentage >= 80) {

  scoreCard.classList.add("score-high");

} else if (percentage >= 40) {

  scoreCard.classList.add("score-medium");

} else {

  scoreCard.classList.add("score-low");

}  


  let title = "";
  let message = "";


  if (percentage >= 80) {

    title = "Strong QA reasoning";

    message =
      "You identified most of the important testing and investigation areas. Keep practicing how you communicate your reasoning clearly.";

  }

  else if (percentage >= 60) {

    title = "Good foundation";

    message =
      "You have solid QA instincts, but some investigation areas should be identified more consistently.";

  }

  else if (percentage >= 40) {

    title = "Developing";

    message =
      "You are identifying useful testing ideas, but your answers need more technical depth and structure.";

  }

  else {

    title = "More practice recommended";

    message =
      "Focus on building a repeatable investigation process: understand the failure, gather evidence, trace the relevant layers and assess risk.";

  }


  document.getElementById("performanceTitle").textContent =
    title;


  document.getElementById("performanceMessage").textContent =
    message;


  const breakdown =
    document.getElementById("scoreBreakdown");


  breakdown.innerHTML = "";


  questionScores.forEach(
    (score, index) => {

      const li =
        document.createElement("li");


      li.textContent =
        `Scenario ${index + 1}: ${score}/10`;


      breakdown.appendChild(li);

    }
  );
}


function restartPractice() {

  startPractice(currentArea);
}

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

  currentInterviewLevel = level;

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
    .getElementById("interview")
    .classList.remove("hidden");


  loadInterviewQuestion();
}

function loadInterviewQuestion() {

  const item =
    currentInterviewQuestions[currentInterviewQuestion];


  document.getElementById("interviewLevelLabel").textContent =
    `${interviewBanks[currentInterviewLevel].name} MOCK INTERVIEW`;


  document.getElementById("interviewProgress").textContent =
    `Interview Question ${currentInterviewQuestion + 1} of ${currentInterviewQuestions.length}`;

  const progressPercentage =
  ((currentInterviewQuestion + 1) /
    currentInterviewQuestions.length) * 100;

document.getElementById(
  "interviewProgressBar"
).style.width =
  `${progressPercentage}%`;  


  document.getElementById("interviewQuestion").textContent =
    item.question;


  document.getElementById("interviewAnswer").value = "";


  document
    .getElementById("interviewError")
    .classList.add("hidden");
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


  const answer =
    rawAnswer.toLowerCase();


  const criteria =
    currentInterviewQuestions[currentInterviewQuestion].criteria;


  let weightedScore = 0;

  const strengths = [];
  const missing = [];


  criteria.forEach(item => {

    const found =
      matchesConcept(
        answer,
        item.words
    );


    if (found) {

      weightedScore += item.weight ?? 2;
      strengths.push(item.label);

    } else {

      missing.push(item.label);

    }

  });


  const score = weightedScore; 

  interviewTotalScore += score;

  interviewQuestionScores.push(score);  

  const nextButton =
  document.getElementById("interviewNextButton");

const isLastQuestion =
  currentInterviewQuestion ===
  currentInterviewQuestions.length - 1;

if (isLastQuestion) {
  nextButton.textContent = "View Interview Scorecard";
} else {
  nextButton.textContent = "Next Interview Question";
}


  document.getElementById("interviewScore").textContent =
    score;


  const strengthsList =
    document.getElementById("interviewStrengths");

  const missingList =
    document.getElementById("interviewMissing");


  strengthsList.innerHTML = "";
  missingList.innerHTML = "";


  strengths.forEach(item => {

    const li =
      document.createElement("li");

    li.textContent = item;

    strengthsList.appendChild(li);

  });


  missing.forEach(item => {

    const li =
      document.createElement("li");

    li.textContent = item;

    missingList.appendChild(li);

  });

  if (strengths.length === 0) {

  const li =
    document.createElement("li");

  li.textContent =
    "No key interview points were identified in this answer.";

  strengthsList.appendChild(li);
}


if (missing.length === 0) {

  const li =
    document.createElement("li");

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


  if (
    currentInterviewQuestion >=
    currentInterviewQuestions.length
  ) {

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


  const percentage =
    (interviewTotalScore / 50) * 100;

  const scoreCard =
  document.getElementById(
    "interviewSummaryScoreCard"
  );

scoreCard.classList.remove(
  "score-low",
  "score-medium",
  "score-high"
);

if (percentage >= 80) {

  scoreCard.classList.add(
    "score-high"
  );

} else if (percentage >= 40) {

  scoreCard.classList.add(
    "score-medium"
  );

} else {

  scoreCard.classList.add(
    "score-low"
  );

}  


  let title = "";
  let message = "";


  if (percentage >= 80) {

    title = "Interview ready";

    message =
      "Strong performance. Your answers consistently demonstrate structured QA reasoning, risk awareness and practical investigation skills.";

  }

  else if (percentage >= 60) {

    title = "Good interview foundation";

    message =
      "You demonstrate solid QA thinking. Continue improving the depth, structure and evidence behind your answers.";

  }

  else if (percentage >= 40) {

    title = "Developing interview confidence";

    message =
      "You have useful QA instincts, but your answers need more structure, technical depth and risk-based reasoning.";

  }

  else {

    title = "More interview practice recommended";

    message =
      "Focus on explaining your reasoning step by step, identifying risk, gathering evidence and communicating clearly with the team.";

  }


  document
    .getElementById("interviewPerformanceTitle")
    .textContent =
    title;


  document
    .getElementById("interviewPerformanceMessage")
    .textContent =
    message;


  const breakdown =
    document.getElementById(
      "interviewScoreBreakdown"
    );


  breakdown.innerHTML = "";


  interviewQuestionScores.forEach(
    (score, index) => {

      const li =
        document.createElement("li");

      li.textContent =
        `Interview Question ${index + 1}: ${score}/10`;

      breakdown.appendChild(li);

    }
  );
}

function restartInterview() {

  selectInterviewLevel(
    currentInterviewLevel
  );
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
    .getElementById("home")
    .classList.remove("hidden");

  
  document
  .getElementById("interviewSetup")
  .classList.add("hidden");  
}