import { expect, authenticatedTest as test } from '../../index.js';

test.describe('Reseed', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/apps/0?language=en', async (route) => {
      await route.fulfill({ path: 'mock-data/demo-test-app-details.json' });
    });
  });

  test('should not show the reseed button if user is not logged in', async ({ browser }) => {
    const page = await browser.newPage({ storageState: undefined });
    await page.route('**/api/apps/0?language=en', async (route) => {
      await route.fulfill({ path: 'mock-data/demo-test-app-details.json' });
    });
    await page.goto('/apps/0/demo-test-app');

    await expect(page.getByRole('button', { name: 'Reseed App' })).toBeHidden();
  });

  test('should show the reseed button if user is logged in', async ({ page }) => {
    await page.goto('/apps/0/demo-test-app');

    await expect(page.getByRole('button', { name: 'Reseed App' })).toBeVisible();
  });

  test('should show user they do not have permission when trying to reseed without permission', async ({
    page,
  }) => {
    await page.goto('/apps/0/demo-test-app');
    await page.getByRole('button', { name: 'Reseed App' }).click();

    await expect(page.getByText('You do not have permission to reseed this app.')).toBeVisible();
  });
});
