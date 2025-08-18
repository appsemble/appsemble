import { expect, test } from '../../index.js';

test.describe('Organizations', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/organizations', async (route) => {
      await route.fulfill({ path: 'mock-data/organization-list.json' });
    });

    await page.route('**/api/organizations/test-org', async (route) => {
      await route.fulfill({ path: 'mock-data/test-organization-details.json' });
    });

    await page.route('**/api/organizations/test-org/apps?language=en', async (route) => {
      await route.fulfill({ path: 'mock-data/app-list.json' });
    });

    await page.route('**/api/organizations/test-org/blocks', async (route) => {
      await route.fulfill({ path: 'mock-data/block-list.json' });
    });

    await page.goto('/en/organizations');
  });

  test('should render a list of organizations', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Test org test-org', exact: true })).toBeVisible();
  });

  test('should link to organization details', async ({ page }) => {
    await page.getByRole('link', { name: 'Test org test-org', exact: true }).click();
    await expect(page.locator('.card > div').first()).toMatchAriaSnapshot(`
      - banner:
        - heading "Test org" [level=1]
        - heading "test-org" [level=6]
      - paragraph: Organization description
      - link "appsemble.com"
      - link "support@appsemble.com"
  `);

    await expect(page.getByRole('heading', { name: 'Apps', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Blocks', exact: true })).toBeVisible();
    await expect(page.getByText('Test app')).toBeVisible();
    await expect(page.getByText('Test block')).toBeVisible();
  });
});
