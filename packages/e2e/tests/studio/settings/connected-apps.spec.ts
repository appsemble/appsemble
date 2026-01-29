import { expect, authenticatedTest as test } from '../../../index.js';

test.describe('Connected apps', () => {
  test('should navigate to connected apps from settings', async ({ page }) => {
    await page.goto('/settings/user');
    await page.getByRole('link', { name: 'Connected apps' }).click();

    await expect(page.locator('main')).toMatchAriaSnapshot(`
    - main:
      - heading "Connected apps" [level=1]
      - paragraph: This page lists all apps which have been connected to your account using a login method.
    `);
  });

  test('should show an empty message when there are no connected apps', async ({ page }) => {
    await page.goto('/settings/user/apps');
    await expect(page.getByText('You haven’t logged in to any Appsemble apps yet.')).toBeVisible();
  });

  test('should show card of connected app', async ({ page }) => {
    await page.route('**/api/users/current/apps/accounts', async (route) => {
      await route.fulfill({ path: 'mock-data/connected-apps.json' });
    });
    await page.goto('/settings/user/apps');

    await expect(page.getByRole('link', { name: 'Test app Test org' })).toBeVisible();
  });
});
