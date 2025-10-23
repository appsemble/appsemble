import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { expect, mergeTests, request } from '@playwright/test';

import { test as appFixtures } from './app/index.js';
import { test as appCollectionFixtures } from './app-collection/index.js';
import { test as demoAppFixtures } from './demo-app/index.js';
import { test as groupFixtures } from './group/index.js';
import { test as liveAppFixtures } from './live-app/index.js';
import { test as organizationFixtures } from './organization/index.js';
import { test as resourceFixtures } from './resource/index.js';
import { test as studioFixtures } from './studio/index.js';
import { test as testUtilsFixtures } from './test-utils/index.js';
import { test as trainingFixtures } from './training/index.js';

/**
 * Base test object with all utility fixtures
 */
export const baseTest = mergeTests(
  appFixtures,
  appCollectionFixtures,
  demoAppFixtures,
  groupFixtures,
  liveAppFixtures,
  organizationFixtures,
  resourceFixtures,
  studioFixtures,
  testUtilsFixtures,
  trainingFixtures,
);

/**
 * Test object with the worker's storage state saved
 *
 * Used for tests that require a logged in user
 */
export const authenticatedTest = baseTest.extend<{}, { workerStorageState: string }>({
  // Use the same storage state for all tests in this worker.
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [
    async ({ browser }, use, testInfo) => {
      const id = `worker-${testInfo.parallelIndex}`;
      const email = `${id}@appsemble.com`;
      const password = id;
      const fileName = resolve(testInfo.project.outputDir, `.auth/${id}.json`);

      if (existsSync(fileName)) {
        await use(fileName);
        return;
      }

      const page = await browser.newPage({ storageState: undefined });
      await page.goto(`${testInfo.project.use.baseURL}/en/login`);

      await page.getByTestId('email').fill(email);
      await page.getByTestId('password').fill(password);
      await page.getByTestId('login').click();

      // Wait until auth state is saved in browser storage
      await expect(page.getByText('My Apps')).toBeVisible();

      await page.context().storageState({ path: fileName });
      await page.close();
      await use(fileName);
    },
    { scope: 'worker' },
  ],

  async request({ baseURL, storageState }, use) {
    const accessToken = JSON.parse(await readFile(String(storageState), 'utf8')).origins[0]
      .localStorage[1].value;
    const newRequest = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    await use(newRequest);
    await newRequest.dispose();
  },
});
