import { expect, test } from '../../index.js';

test.describe('Blocks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/blocks');
  });

  test('should render a list of blocks', async ({ page }) => {
    const dataLoader = page.locator('[title="@appsemble/data-loader"]');
    await expect(dataLoader).toContainText('data-loader');
    await expect(dataLoader).toContainText('@appsemble');
    await expect(dataLoader).toContainText(
      'A block that fetches data and emits it using the events API.',
    );
  });

  test('should link to block details', async ({ page }) => {
    const dataLoader = page.locator('[title="@appsemble/data-loader"]');
    await dataLoader.locator('text=View details').click();
    await expect(page.getByRole('heading', { name: 'Parameters', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Actions', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();
  });
});
