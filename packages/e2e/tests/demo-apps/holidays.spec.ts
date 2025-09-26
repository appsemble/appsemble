import { readFile } from 'node:fs/promises';

import { expect, test } from '../../index.js';

let appId: number;
let organizationId: string;

test.describe('Holidays', () => {
  test.beforeAll(async ({ createApp, createOrganization, randomTestId }) => {
    const appDefinition = await readFile('../../apps/holidays/app-definition.yaml', 'utf8');
    organizationId = (await createOrganization({ id: randomTestId() })).id;

    appId = (await createApp(organizationId, appDefinition)).id!;
  });

  test.afterAll(async ({ deleteApp, deleteOrganization }) => {
    await deleteApp(appId);
    await deleteOrganization(organizationId);
  });

  test.beforeEach(async ({ page, visitApp }) => {
    await page.route('/api/apps/*/actions/pages.0.tabs.0.blocks.0.actions.onLoad*', (route) => {
      route.fulfill({ path: 'mock-data/holidays-nl.json' });
    });
    await page.route('/api/apps/*/actions/pages.0.tabs.1.blocks.0.actions.onLoad*', (route) => {
      route.fulfill({ path: 'mock-data/holidays-de.json' });
    });
    await page.route('/api/apps/*/actions/pages.1.tabs.0.blocks.0.actions.onLoad*', (route) => {
      route.fulfill({ path: 'mock-data/holidays-us.json' });
    });

    await visitApp(appId);
    await page.waitForURL('**/holidays-in-europe/netherlands');
  });

  test('should navigate to the second tab', async ({ page }) => {
    await page.click('text=Germany');
    await expect(page.getByText('Mariä Himmelfahrt')).toBeVisible();
  });

  test('should navigate to the American holidays page', async ({ page }) => {
    await page.click('text=Holidays in America');
    await expect(page.getByText('Independence Day')).toBeVisible();
  });
});
