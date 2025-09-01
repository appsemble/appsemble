import { defineConfig, devices } from '@playwright/test';

const { APPSEMBLE_REVIEW_DOMAIN, APPSEMBLE_STAGING_DOMAIN, CI, CI_MERGE_REQUEST_IID, E2E_HOST } =
  process.env;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testMatch: '**/*.spec.ts',
  // Tests aren't fully isolated so they shouldn't run in parallel
  fullyParallel: false,
  // Fail the build on CI if you accidentally left test.only in the source code.
  forbidOnly: Boolean(CI),
  // Retry on CI only
  retries: CI ? 2 : 0,
  // A lot of tests depend on the same pre-seeded apps, so more workers can introduce flakiness.
  workers: 1,
  // Reporter to use. See https://playwright.dev/docs/test-reporters
  reporter: [['junit', { outputFile: 'results.xml' }]],
  // Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
  use: {
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL: CI
      ? (E2E_HOST ??
        `https://${
          CI_MERGE_REQUEST_IID
            ? `${CI_MERGE_REQUEST_IID}.${APPSEMBLE_REVIEW_DOMAIN || 'appsemble.review'}`
            : APPSEMBLE_STAGING_DOMAIN || 'staging.appsemble.eu'
        }`)
      : 'http://localhost:9999',
    // Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
    trace: 'on-first-retry',
    video: 'on',
  },

  // Configure projects for major browsers
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
