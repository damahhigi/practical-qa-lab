# Practical QA Lab

Practical QA Lab is an interactive learning platform for practising real-world software quality assurance scenarios.

It is designed to help QA professionals and aspiring testers strengthen practical testing skills through scenario-based exercises, instant feedback and mock interview practice.

## Current Features

### Manual QA Practice
- Real-world testing scenarios
- Investigation and debugging exercises
- Risk-based reasoning
- Weighted scoring
- Instant feedback

### API Testing Practice
- REST API scenarios
- Authentication and authorization
- Data persistence
- Pagination
- Idempotency and payment testing

### SQL Testing Practice
- Database validation
- SELECT queries
- GROUP BY and aggregation
- JOIN scenarios
- Transaction and persistence testing


### QA Mock Interview
- Junior QA interview questions
- Mid-Level QA interview questions
- Weighted answer scoring
- Strong-point feedback
- Improvement recommendations
- Level-specific interview feedback
- Final interview scorecard


## Scoring

Answers are evaluated using structured QA concepts and weighted criteria.

Each scenario is scored out of 10, with higher-value concepts receiving more weight based on their importance to the testing approach.

## Responsive Design

Practical QA Lab supports desktop and mobile layouts, including smaller mobile screens.

## Technology

- HTML
- CSS
- JavaScript

The current version runs entirely in the browser and does not require a backend.




## Current Version

### v0.6 — Export & Import Progress

Learners can now back up and restore their learning
progress without creating an account.

#### New Features
- Export completed learning sessions to JSON
- Import saved progress from a JSON backup
- Preview backup contents before importing
- Merge imported sessions with existing history
- Detect and skip duplicate session IDs
- Replace current progress with a saved backup
- Confirmation required before replacing history
- Reject invalid or unsupported backup files
- Preserve saved progress after refreshing
- Responsive export and import sections

#### How It Works
Progress is stored locally in the browser using
localStorage.

Export creates a downloadable JSON file containing
completed sessions, scores, and completion dates.

Import supports two options:
- Merge: Keep existing progress and add new sessions.
- Replace: Remove existing history and restore the
  selected backup.

No login, database, or paid hosting is required.

#### Limitations
- Progress does not automatically sync between devices.
- Learners must export and import files manually.
- Clearing browser data can remove locally saved progress.
- Backup files should be stored somewhere safe.


## Planned Features

Future versions may include:

- Larger question banks
- User accounts
- AI-assisted answer evaluation
- Interview history
- Additional QA practice areas

## Project

Practical QA Lab is a Practical QA Press project.