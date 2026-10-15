import { readFile } from 'node:fs/promises';

import { type AppsembleMessages } from '@appsemble/types';

import { expect, authenticatedTest as test } from '../../index.js';

const minimumScore = 85;

let organizationId: string;
const appIds: number[] = [];

test.describe('Accessibility', () => {
  test.beforeAll(async ({ createOrganization, randomTestId }) => {
    organizationId = (await createOrganization({ id: randomTestId() })).id;
  });

  test.afterAll(async ({ deleteApp, deleteOrganization }) => {
    for (const appId of appIds) {
      await deleteApp(appId);
    }
    await deleteOrganization(organizationId);
  });

  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== 'chromium', 'The axe-core results do not depend on the browser');
  });

  test('person app scores at least the minimum', async ({
    createApp,
    page,
    scanAppAccessibility,
    uploadAppMessages,
    visitApp,
  }) => {
    const appDefinition = await readFile('../../apps/person/app-definition.yaml', 'utf8');
    const messages = JSON.parse(
      await readFile('../../apps/person/i18n/en.json', 'utf8'),
    ) as AppsembleMessages;
    const appId = (await createApp(organizationId, appDefinition)).id!;
    appIds.push(appId);
    await uploadAppMessages(appId, 'en', messages);

    await visitApp(appId);
    await page.waitForURL('**/person-registration-form');
    const { pages, score } = await scanAppAccessibility();

    expect(score, JSON.stringify(pages, null, 2)).toBeGreaterThanOrEqual(minimumScore);
  });

  test('notes app scores at least the minimum', async ({
    createApp,
    giveAppConsent,
    loginAppAppsembleOAuth,
    page,
    scanAppAccessibility,
    visitApp,
  }) => {
    const appDefinition = await readFile('../../apps/notes/app-definition.yaml', 'utf8');
    const appId = (await createApp(organizationId, appDefinition)).id!;
    appIds.push(appId);
    await giveAppConsent(appId);

    await visitApp(appId);
    await loginAppAppsembleOAuth();
    await page.waitForURL('**/notes');
    const { pages, score } = await scanAppAccessibility();

    expect(score, JSON.stringify(pages, null, 2)).toBeGreaterThanOrEqual(minimumScore);
  });
});
