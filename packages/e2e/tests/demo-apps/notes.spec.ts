import { readFile } from 'node:fs/promises';

import { expect, authenticatedTest as test } from '../../index.js';

let appId: number;
let organizationId: string;

test.describe('Notes', () => {
  test.beforeAll(async ({ createApp, createOrganization, giveAppConsent, randomTestId }) => {
    const appDefinition = await readFile('../../apps/notes/app-definition.yaml', 'utf8');
    organizationId = (await createOrganization({ id: randomTestId() })).id;

    appId = (await createApp(organizationId, appDefinition)).id!;

    await giveAppConsent(appId);
  });

  test.afterAll(async ({ deleteApp, deleteOrganization }) => {
    await deleteApp(appId);
    await deleteOrganization(organizationId);
  });

  test.beforeEach(async ({ loginAppAppsembleOAuth, page, visitApp }) => {
    await visitApp(appId);
    await loginAppAppsembleOAuth();
    await page.waitForURL('**/notes');
  });

  test('should create a new note and view it', async ({ page }) => {
    const date = Date.now();

    await page.click('.button.is-rounded');
    await page.fill('#title', `Title ${date}`);
    await page.fill('#body', `Body ${date}`);
    await page.click('button[type="submit"]');

    const entry = page.locator(`text=Title ${date}`);
    await expect(entry).toBeVisible();
    await entry.click();
    await expect(page.getByPlaceholder('title')).toHaveValue(`Title ${date}`);
    await expect(page.getByPlaceholder('body')).toHaveValue(`Body ${date}`);
  });
});
