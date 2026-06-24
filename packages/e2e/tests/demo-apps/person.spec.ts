import { readFile } from 'node:fs/promises';

import { type AppsembleMessages } from '@appsemble/types';

import { expect, authenticatedTest as test } from '../../index.js';

let appId: number;
let organizationId: string;

test.describe('Person', () => {
  test.beforeAll(async ({ createApp, createOrganization, randomTestId, uploadAppMessages }) => {
    const appDefinition = await readFile('../../apps/person/app-definition.yaml', 'utf8');
    const englishTranslations = JSON.parse(
      await readFile('../../apps/person/i18n/en.json', 'utf8'),
    ) as AppsembleMessages;
    organizationId = (await createOrganization({ id: randomTestId() })).id;

    appId = (await createApp(organizationId, appDefinition)).id!;

    await uploadAppMessages(appId, 'en', englishTranslations);
  });

  test.afterAll(async ({ deleteApp, deleteOrganization }) => {
    await deleteApp(appId);
    await deleteOrganization(organizationId);
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

    // The form block resets field values while it finishes initializing (the
    // file field briefly holds the form in a loading state), dropping values
    // typed too early. Re-fill until every field keeps its value.
    await expect(async () => {
      await page.getByPlaceholder("First name").fill(firstName);
      await page.getByPlaceholder("Last name").fill(lastName);
      await page.getByPlaceholder("Email").fill(email);
      await page.getByPlaceholder("Description").fill(description);

      await expect(page.getByPlaceholder("First name")).toHaveValue(firstName, {
        timeout: 1000,
      });
      await expect(page.getByPlaceholder("Last name")).toHaveValue(lastName, {
        timeout: 1000,
      });
      await expect(page.getByPlaceholder("Email")).toHaveValue(email, {
        timeout: 1000,
      });
      await expect(page.getByPlaceholder("Description")).toHaveValue(description, {
        timeout: 1000,
      });
    }).toPass({ timeout: 10000 });

    await page.click('button[type="submit"]');

    await page.click(`td:has-text("${firstName}")`);

    await expect(page.getByText(firstName)).toBeVisible();
    await expect(page.getByText(lastName)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText(description)).toBeVisible();
  });
});
