import { expect, test } from '../../index.js';

test.describe('Notes', () => {
  test.beforeAll(async ({ getAppId, giveAppConsent }) => {
    const appId = await getAppId('notes');
    await giveAppConsent(appId);
  });

  test.beforeEach(async ({ loginAppAppsembleOAuth, page, visitApp }) => {
    await visitApp('notes');
    await loginAppAppsembleOAuth();
    await page.waitForURL('**/notes');
  });

  test('should create a new note and view it', async ({ page }) => {
    const date = Date.now();

    await page.click('.button.is-rounded');
    await page.fill('#title', `Title ${date}`);
    await page.fill('#body', `Body ${date}`);
    await page.click('button[type="submit"]');

    const entry = page.locator(`text=Title ${date}`);
    await expect(entry).toBeVisible();
    await entry.click();
    await expect(page.getByPlaceholder('title')).toHaveValue(`Title ${date}`);
    await expect(page.getByPlaceholder('body')).toHaveValue(`Body ${date}`);
  });
});
