import { readFile } from 'node:fs/promises';

import { expect, test } from '../../index.js';

let appId: number;

test.describe('Empty', () => {
  test.beforeAll(async ({ createApp }) => {
    const appDefinition = await readFile('../../apps/empty/app-definition.yaml', 'utf8');

    appId = (await createApp('appsemble', appDefinition)).id!;
  });

  test.afterAll(async ({ deleteApp }) => {
    await deleteApp(appId);
  });

  test.beforeEach(async ({ page, visitApp }) => {
    await visitApp(appId);
    await page.waitForURL('**/example-page-a');
  });

  test('should navigate to the second page and back', async ({ page }) => {
    await page.click('a.button');
    await expect(page.getByRole('heading', { name: 'Example Page B' })).toBeVisible();
    await page.click('a.button');
    await expect(page.getByRole('heading', { name: 'Example Page A' })).toBeVisible();
  });
});
