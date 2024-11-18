import { expect, test } from '../fixtures/test/index.js';

test.describe('Apps', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/apps');
  });

  test('should show the page header', async ({ page }) => {
    await expect(page.locator('text=All Apps')).toBeVisible();
    await expect(page.locator('text=My Apps')).toBeHidden();
  });

  test('should display “My Apps” when logged in', async ({ login, page }) => {
    await login('/en/apps');
    await expect(page.getByText('My Apps')).toBeVisible();
  });

  test('should render a list of apps', async ({ page }) => {
    await expect(page.getByText('Empty App')).toBeVisible();
    await expect(page.getByText('Holidays')).toBeVisible();
    await expect(page.getByText('Notes')).toBeVisible();
    await expect(page.getByText('Person')).toBeVisible();
    await expect(page.getByText('Survey')).toBeVisible();
    await expect(page.getByText('Unlittered')).toBeVisible();
  });

  test('should link to app details', async ({ page }) => {
    await page.click('text=Empty App');
    await expect(
      page.getByText(
        'Empty App is a bare-bones app with two pages and buttons switching between them.',
      ),
    ).toBeVisible();
  });
});
