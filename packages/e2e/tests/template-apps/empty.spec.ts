import { expect, test } from '../../index.js';

test.describe('Empty', () => {
  test.beforeEach(async ({ page, visitApp }) => {
    await visitApp('empty');
    await page.waitForURL('**/example-page-a');
  });

  test('should navigate to the second page and back', async ({ page }) => {
    await page.click('a.button');
    await expect(page.getByRole('heading', { name: 'Example Page B' })).toBeVisible();
    await page.click('a.button');
    await expect(page.getByRole('heading', { name: 'Example Page A' })).toBeVisible();
  });
});
