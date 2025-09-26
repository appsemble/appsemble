import { expect, test } from '../../index.js';

const { BOT_ACCOUNT_EMAIL, BOT_ACCOUNT_PASSWORD } = process.env;

test.describe('Apps', () => {
  // Prevent worker from being logged in automatically
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.route('**/apps?language=en', async (route) => {
      await route.fulfill({ path: 'mock-data/app-list.json' });
    });

    await page.route('**/api/apps/0?language=en', async (route) => {
      await route.fulfill({ path: 'mock-data/test-app-details.json' });
    });

    await page.goto('/en/apps');
  });

  test('should show the page header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'All Apps', exact: true })).toBeVisible();
  });

  test('should display “My Apps” when logged in', async ({ loginUser, page }) => {
    expect(BOT_ACCOUNT_EMAIL && BOT_ACCOUNT_PASSWORD).not.toBeUndefined();
    await loginUser(BOT_ACCOUNT_EMAIL!, BOT_ACCOUNT_PASSWORD!);

    await expect(page.getByRole('heading', { name: 'My Apps', exact: true })).toBeVisible();
  });

  test('should render list of apps', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Test app Test org' }).first())
      .toMatchAriaSnapshot(`
  - link "Test app Test org":
    - figure: 
    - heading "Test app" [level=3]
    - heading "Test org" [level=6]
`);
  });

  test('should link to app details', async ({ page }) => {
    await page.getByRole('link', { name: 'Test app Test org' }).first().click();
    await expect(page.getByText('Test app description')).toBeVisible();
  });
});
