import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config. The frontend is exercised as a production build served
 * statically by tests/../serve.mjs, with the API layer intercepted
 * (tests/fixtures.ts). This keeps the suite hermetic: no Postgres, no AI
 * keys, no network.
 *
 * Run:  npm run test:e2e   (from the repo root)
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['line'], ['json', { outputFile: 'results.json' }]] : [['list']],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node serve.mjs ../packages/frontend/dist 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
