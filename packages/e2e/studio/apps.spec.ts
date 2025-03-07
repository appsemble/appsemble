import { expect, test } from '../fixtures/test/index.js';

test.describe('Apps', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/en/apps');
  });

  test('should show the page header', async ({ page }) => {
    await expect(page.locator('text=All Apps')).toBeVisible();
    await expect(page.locator('text=My Apps')).toBeHidden();
  });

  test('should display “My Apps” when logged in', async ({ loginStudio, page }) => {
    await loginStudio('/en/apps');
    await expect(page.getByText('My Apps')).toBeVisible();
  });

  const defaultApps = [
    { name: 'Empty App' },
    { name: 'Holidays' },
    { name: 'Notes' },
    { name: 'Person' },
    { name: 'Survey' },
    { name: 'Unlittered' },
  ];
  for (const { name } of defaultApps) {
    test(`should render "${name}" app`, async ({ page }) => {
      await expect(page.getByText(name).first()).toBeVisible();
    });
  }

  test('should link to app details', async ({ page }) => {
    await page.click('text=Empty App');
    await expect(
      page.getByText(
        'Empty App is a bare-bones app with two pages and buttons switching between them.',
      ),
    ).toBeVisible();
  });
});
