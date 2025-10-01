import { type Page } from '@playwright/test';

import { expect, baseTest as test } from '../../index.js';

const { BOT_ACCOUNT_EMAIL, BOT_ACCOUNT_PASSWORD } = process.env;

let page: Page;

test.describe('Individual app', () => {
  test.beforeAll(async ({ browser, loginUserOnPage }) => {
    page = await browser.newPage({ storageState: undefined });

    expect(BOT_ACCOUNT_EMAIL && BOT_ACCOUNT_PASSWORD).not.toBeUndefined();
    await loginUserOnPage(BOT_ACCOUNT_EMAIL!, BOT_ACCOUNT_PASSWORD!, page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    await page.route('**/api/apps/0?language=en', async (route) => {
      await route.fulfill({ path: 'mock-data/test-app-details.json' });
    });

    await page.route('**/api/users/current', async (route) => {
      await route.fulfill({ path: 'mock-data/user-info.json' });
    });

    await page.route('**/api/users/current/organizations', async (route) => {
      await route.fulfill({ path: 'mock-data/organization-list.json' });
    });

    await page.route('**/api/apps/0/resources/test-resource', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/apps/0/snapshots', async (route) => {
      await route.fulfill({ path: 'mock-data/snapshot-list.json' });
    });

    await page.goto('/en/apps/0/test-app');
  });

  test('should show the app name in the side menu', async () => {
    await expect(page.getByTestId('studio-app-side-menu-name')).toHaveText('test app');
  });

  test('should link to the asset viewer', async ({ clickAppSideMenuItemOnPage }) => {
    await clickAppSideMenuItemOnPage('Assets', page);
    await expect(page.getByText('Upload new asset')).toBeVisible();
  });

  test('should link to resources', async ({ clickAppSideMenuItemOnPage }) => {
    await clickAppSideMenuItemOnPage('Resources', page);
    await expect(page.getByText('This app has the following resources')).toBeVisible();
  });

  test('should link to a specific resource', async ({ clickAppSideMenuItemOnPage }) => {
    await clickAppSideMenuItemOnPage('Resources', page);
    await page.click('li :has-text("Test resource")');
    await expect(page.getByText('Resource: Test resource')).toBeVisible();
  });

  test('should link to the translator tool', async ({ clickAppSideMenuItemOnPage }) => {
    await clickAppSideMenuItemOnPage('Translations', page);
    await expect(page.getByText('Selected language')).toBeVisible();
  });

  test('should link to the notification sender', async ({ clickAppSideMenuItemOnPage }) => {
    await clickAppSideMenuItemOnPage('Notifications', page);
    await expect(
      page.getByText('Push notifications are currently not enabled in this app.'),
    ).toBeVisible();
  });

  test('should link to the snapshots page', async ({ clickAppSideMenuItemOnPage }) => {
    await clickAppSideMenuItemOnPage('Snapshots', page);
    await expect(page.getByRole('heading', { name: 'Snapshots' })).toBeVisible();
    await expect(
      page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Appsemble' }) }),
    ).toBeVisible();
  });

  test('should link to the app settings', async ({ clickAppSideMenuItemOnPage }) => {
    await clickAppSideMenuItemOnPage('Settings', page);
    await expect(page.getByRole('heading', { name: 'App lock' })).toBeVisible();
  });

  test('should link to the app secrets', async ({ clickAppSideMenuItemOnPage }) => {
    await clickAppSideMenuItemOnPage('Secrets', page);
    await expect(page.getByRole('heading', { name: 'Appsemble Login' })).toBeVisible();
  });
});
