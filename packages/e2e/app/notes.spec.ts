import { expect, test } from '../fixtures/test/index.js';

test.describe('Notes', () => {
  test.beforeEach(async ({ visitApp }) => {
    await visitApp('notes');
  });

  test('should create a new note and view it', async ({ loginApp, page }) => {
    const date = Date.now();

    await loginApp();
    await page.waitForSelector('.button.is-rounded');
    await page.click('.button.is-rounded');
    await page.fill('#title', `Title ${date}`);
    await page.fill('#body', `Body ${date}`);
    await page.click('button[type="submit"]');
    const entry = page.locator(`text=Title ${date}`);
    await expect(entry).toBeVisible();
    await entry.click();
    expect(await page.getByPlaceholder('title').inputValue()).toBe(`Title ${date}`);
    expect(await page.getByPlaceholder('body').inputValue()).toBe(`Body ${date}`);
  });
});