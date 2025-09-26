import { readFile } from 'node:fs/promises';

import { expect, test } from '../../index.js';

let appId: number;
let organizationId: string;

test.describe('Empty', () => {
  test.beforeAll(async ({ createApp, createOrganization, randomTestId }) => {
    const appDefinition = await readFile('../../apps/empty/app-definition.yaml', 'utf8');
    organizationId = (await createOrganization({ id: randomTestId() })).id;

    appId = (await createApp(organizationId, appDefinition)).id!;
  });

  test.afterAll(async ({ deleteApp, deleteOrganization }) => {
    await deleteApp(appId);
    await deleteOrganization(organizationId);
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
