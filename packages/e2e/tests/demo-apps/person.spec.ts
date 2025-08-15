import { readFile } from 'node:fs/promises';

import { type AppsembleMessages } from '@appsemble/types';

import { expect, test } from '../../index.js';

let appId: number;

test.describe('Person', () => {
  test.beforeAll(async ({ createApp, uploadAppMessages }) => {
    const appDefinition = await readFile('../../apps/person/app-definition.yaml', 'utf8');
    const englishTranslations = JSON.parse(
      await readFile('../../apps/person/i18n/en.json', 'utf8'),
    ) as AppsembleMessages;

    appId = (await createApp('appsemble', appDefinition)).id!;

    await uploadAppMessages(appId, 'en', englishTranslations);
  });

  test.afterAll(async ({ deleteApp }) => {
    await deleteApp(appId);
  });

  test.beforeEach(async ({ page, visitApp }) => {
    await visitApp(appId);
    await page.waitForURL('**/person-registration-form');
  });

  test('should submit a new person and view it', async ({ page }) => {
    const date = Date.now();

    const firstName = `First name ${date}`;
    const lastName = `Last name ${date}`;
    const email = `Email${date}@example.com`;
    const description = `Description ${date}`;

    await page.fill('[placeholder="First name"]', firstName);
    await page.fill('[placeholder="Last name"]', lastName);
    await page.fill('[placeholder="Email"]', email);
    await page.fill('[placeholder="Description"]', description);

    await page.click('button[type="submit"]');

    await page.click(`td:has-text("${firstName}")`);

    await expect(page.getByText(firstName)).toBeVisible();
    await expect(page.getByText(lastName)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });
});
