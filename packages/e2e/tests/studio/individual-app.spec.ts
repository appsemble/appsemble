import { readFile } from 'node:fs/promises';

import { type App } from '@appsemble/types';

import { expect, authenticatedTest as test } from '../../index.js';

let appId: number;

test.describe('Individual app', () => {
  test.beforeAll(async ({ createApp, createOrganization, randomTestId }) => {
    const { yaml } = JSON.parse(await readFile('mock-data/test-app-details.json', 'utf8')) as App;
    const organizationId = (await createOrganization({ id: randomTestId() })).id;

    appId = (await createApp(organizationId, yaml!)).id!;
  });

  test.afterAll(async ({ deleteApp }) => {
    await deleteApp(appId);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/en/apps/${appId}`);
  });

  test('should prompt when user has unsaved changes', async ({ clickAppSideMenuItem, page }) => {
    await clickAppSideMenuItem('Editor');
    page.on('dialog', (alert) => {
      expect(alert.type()).toBe('confirm');
      expect(alert.message()).toBe('You have unsaved changes. Do you wish to continue?');
      alert.dismiss();
    });

    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
    const codeEditor = page.getByRole('code');
    await codeEditor.getByText('name: test app').click();
    await codeEditor.getByText('name: test app').press('End');
    await codeEditor.getByText('name: test app').press('Backspace');
    await codeEditor.getByText('name: test ap').press('p');
    await expect(page.getByRole('button', { name: 'Publish' })).toBeEnabled();

    await page.getByRole('link', { name: 'Details' }).click();

    await expect(page.getByText('Clone App')).toBeHidden();
  });

  test('should not prompt when user has saved their changes', async ({
    clickAppSideMenuItem,
    page,
  }) => {
    await clickAppSideMenuItem('Editor');
    page.on('dialog', (alert) => {
      // If a dialog comes up at all, the test should fail
      expect(alert).toBeNull();
    });

    await expect(page.getByRole('button', { name: 'Publish' })).toBeDisabled();
    const codeEditor = page.getByRole('code');
    await codeEditor.getByText('name: test app').click();
    await codeEditor.getByText('name: test app').press('End');
    await codeEditor.getByText('name: test app').press('Backspace');
    await codeEditor.getByText('name: test ap').press('p');

    await page.getByRole('button', { name: 'Publish' }).click();

    await expect(page.getByText('Successfully updated app definition')).toBeVisible();

    await page.getByRole('link', { name: 'Details' }).click();

    await expect(page.getByText('Clone App')).toBeVisible();
  });
});
