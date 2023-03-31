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
    await page.waitForSelector('text=My Apps');
  });

  test('should render a list of apps', async ({ page }) => {
    await page.waitForSelector('text="Empty App"');
    await page.waitForSelector('text="Holidays"');
    await page.waitForSelector('text="Notes"');
    await page.waitForSelector('text="Person"');
    await page.waitForSelector('text="Survey"');
    await page.waitForSelector('text="Unlittered"');
  });

  test('should link to app details', async ({ page }) => {
    await page.click('text=Empty App');
    await page.waitForSelector(
      'text="Empty App is a bare-bones app with two pages and buttons switching between them."',
    );
  });
});
