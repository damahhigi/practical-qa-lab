# Practical QA Lab — Playwright smoke tests (v0.9 Stage 1)

**This folder contains only tests.** Keep it beside the existing `index.html` and the two lab folders. Do not replace existing application files.

## Expected folder layout

```text
practical-qa-lab/
├── index.html
├── script.js
├── style.css
├── checkout-bug-hunt/
├── test-case-lab/
└── qa-tests/
    ├── package.json
    ├── playwright.config.ts
    ├── tests/smoke.spec.ts
    └── .gitignore
```

## Setup on Mac (Node.js installed)

1. Open the existing `practical-qa-lab` folder in VS Code.
2. Open the integrated terminal.
3. Run `cd qa-tests`.
4. Run `npm install`.
5. Run `npx playwright install chromium`.
6. Run `npm test`.

Playwright will start a local Python web server automatically if port 8000 is free. If you already have `python3 -m http.server 8000` running, it will reuse the server. Ensure an existing server serves your *current* practical-qa-lab project. To stop an old server, press Ctrl+C in its terminal.

## What the tests cover

1. Homepage links and initial progress dashboard.
2. Checkout Bug Hunt — Notebook subtotal, discount, shipping and final total baseline.
3. Test Case Writing Lab — create, refresh, review, and main dashboard integration.

Each Playwright test uses a fresh browser context, so your normal Chrome data is not touched. Existing intentional bugs in Checkout Bug Hunt are NOT treated as regressions here.

## Troubleshooting

- **`npm: command not found`**: install Node.js (LTS) before proceeding.
- **`python3: command not found`**: install Python 3 or run the server separately and adjust the webServer config.
- **`Port 8000 already used` / wrong page appears**: stop the existing server and rerun.
- **Chromium missing**: run `npx playwright install chromium`.
- **Failed assertion**: share the terminal failure and `test-results/` screenshot or trace. Don't change the app just to make the test pass until we establish the expected behaviour.

Run `npm run test:headed` if you want to see a real browser window during the tests. After tests pass, we can add mobile checks and GitHub Actions.
