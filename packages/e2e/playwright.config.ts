import { defineConfig, devices } from '@playwright/test';

const { CI, CI_MERGE_REQUEST_IID, E2E_HOST } = process.env;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testMatch: '**/*.spec.ts',
  // Run tests in files in parallel
  fullyParallel: true,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: Boolean(CI),
  // Retry on CI only
  retries: CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: CI ? 1 : undefined,
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: [['junit', { outputFile: 'results.xml' }]],
  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: CI
      ? E2E_HOST ?? `https://${CI_MERGE_REQUEST_IID || 'staging'}.appsemble.review`
      : 'http://localhost:9999',
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
    video: 'on',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
