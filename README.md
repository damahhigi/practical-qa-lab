# Practical QA Lab

[![Playwright Regression Tests](https://github.com/damahhigi/practical-qa-lab/actions/workflows/playwright.yml/badge.svg)](https://github.com/damahhigi/practical-qa-lab/actions/workflows/playwright.yml)

**Live website:** https://damahhigi.github.io/practical-qa-lab/

**Release:** v1.6 — Connected QA Journey & Portable Evidence (October 2026)

Practical QA Lab is a free, browser-based QA practice environment featuring interactive scenarios, guided simulations, feedback, and interview preparation. The website is static: no account or backend is required.

## Main learning experiences

- **Manual QA practice:** test design, exploration, functional testing, debugging and risk-based decisions.
- **API testing questions:** HTTP requests, authentication, persistence, pagination, idempotency and related testing concepts.
- **SQL testing questions:** query writing and reasoning about joins, aggregation, transactions and data validation.
- **QA Mock Interview:** junior, mid-level and senior exercises with scoring and feedback.

## Hands-on labs

| Lab | Purpose |
| --- | --- |
| [Test Case Writing](test-case-lab/) | Create, edit, assess and export requirement-based test cases |
| [Checkout Bug Hunt](checkout-bug-hunt/) | Investigate cart defects, document findings and download reports |
| [API Testing Lab](api-testing-lab/) | Exercise an in-browser simulated REST API |
| [API Bug Hunt](api-bug-hunt/) | Investigate seeded API defects, document findings and download reports |
| [SQL Validation](sql-validation-lab/) | Query fictional datasets, investigate defects and download reports |
| [Bug Triage](bug-triage/) | Evaluate severity, priority, assignment and next actions |
| [Release Readiness](release-readiness/) | Review testing evidence, release risks and Go/No-Go decisions |

These experiences provide educational simulations and rule-based feedback. They do not test production systems.

## Test Automation Learning Path

The [Automation Learning Path](automation-lab/learning-path/) contains six guided Playwright and TypeScript modules:

1. Playwright Fundamentals
2. Locators & Interactions
3. Assertions & Validation
4. Negative & Boundary Testing
5. Debugging Flaky Tests
6. API Automation

The modules provide selected-code exercises, feedback, browser-local drafts and completed-session progress saving.

### ShopFlow Automation Capstone (v1.5)

The [ShopFlow Capstone](automation-lab/capstone/) combines six missions, seven fictional acceptance criteria and 20 guided assessment decisions. Learners can calculate an overall score out of 100, see mission feedback and recommended improvements, download a text assessment report and optionally save completed attempts to My Progress. Repeating the same answers does not create duplicate progress records.

**Simulation disclosure:** These exercises evaluate the choices learners make. They do not execute learner-written Playwright tests or interact with a live ShopFlow store/API. The Capstone's release-readiness guidance is an educational exercise, not a real system release decision.

## Learning Paths

The [main Learning Paths](learning-paths/) now include four routes: Beginner QA, Intermediate QA, Interview Preparation and QA Test Automation. The automation route connects six existing Playwright modules and the ShopFlow Capstone, tracking each of the seven activities independently.

## My Progress and learner data

The platform saves supported assessment sessions in browser-local storage (`practicalQaLab.progress.v1`), with recent history, area averages, best scores, suggestions and versioned JSON export/import. Saved-session history is limited to 250 entries.

**Back up authored work separately:** My Progress JSON backups contain completed-session records, not every draft or full written bug report. The Test Case Writing Lab has its own test-case JSON export/import; ShopFlow can download a text assessment report. Checkout Bug Hunt, API Bug Hunt and SQL Validation now offer separate text downloads of learner-written reports. Those reports remain in separate browser storage and are not included in the central My Progress backup.

There is no account-based synchronization. Storage is specific to a browser profile and website origin. Back up important work before clearing browser data.

## Testing and technology

- HTML, CSS and JavaScript for the website and its in-browser simulations
- Playwright and TypeScript for automated regression testing
- GitHub Actions for CI and GitHub Pages for hosting
- Python 3 local HTTP server for development/test runs

The v1.6 regression suite passes **188 Playwright tests**, up from 165 in v1.5; see [the test README](qa-tests/README.md) for setup and run commands.

```bash
cd qa-tests
npm ci
npx playwright install chromium
npx playwright test --reporter=line
```

Targeted automated accessibility and responsive-layout checks are included; they are not a full accessibility certification or exhaustive cross-browser audit.

## Resources

The [`resources/`](resources/) folder provides QA test-case, bug-report and interview-preparation templates.

## v1.6 release highlights

v1.6 adds the connected Automation Learning Path, seven-activity progress tracking, and downloadable reports in Checkout Bug Hunt, API Bug Hunt and SQL Validation. It also corrects outdated documentation and includes additional regression coverage. No new duplicate labs were introduced.

Practical QA Lab is a **Practical QA Press** project.
