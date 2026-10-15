
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  fullyParallel: true,

  retries: 0,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    ...devices['Desktop Chrome'],

    baseURL: 'http://127.0.0.1:8001',

    trace: 'retain-on-failure',

    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'python3 -m http.server 8001 --bind 127.0.0.1',

    cwd: '..',

    url: 'http://127.0.0.1:8001/',

    reuseExistingServer: false,

    timeout: 30_000,
  },
});
