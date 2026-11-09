import { readFile } from 'node:fs/promises';

import { expect, authenticatedTest as test } from '../../index.js';

let appId: number;
let organizationId: string;

test.describe('Mail', () => {
  test.beforeAll(async ({ createApp, createOrganization, randomTestId, giveAppConsent }) => {
    const appDefinition = await readFile('../../apps/mail/app-definition.yaml', 'utf8');
    organizationId = (await createOrganization({ id: randomTestId() })).id;

    appId = (await createApp(organizationId, appDefinition)).id!;
    await giveAppConsent(appId);
  });

  test.beforeEach(async ({ visitApp, loginAppAppsembleOAuth }) => {
    await visitApp(appId);
    await loginAppAppsembleOAuth();
  });

  test.afterAll(async ({ deleteApp, deleteOrganization }) => {
    await deleteApp(appId);
    await deleteOrganization(organizationId);
  });

  test('should send an email when pressing the email button', async ({
    page,
    mailpit,
  }, testInfo) => {
    await page.locator('[data-block="@appsemble/action-button"]').getByRole('button').click();
    await page.waitForResponse('**/actions/pages.0.blocks.0.actions.onClick');

    const message = await mailpit.waitForMessage({
      query: `to:worker-${testInfo.parallelIndex}@appsemble.com from:Appsemble Mail App`,
    });

    expect(message.Subject).toBe('Test Email');
    expect(message.From.Name).toBe('Appsemble Mail App');
    expect(message.Text.trim()).toBe('This is a test email.');
  });
});
