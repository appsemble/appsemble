import { expect, test } from '../fixtures/test/index.js';

test.describe('Empty', () => {
  test.beforeEach(async ({ visitApp }) => {
    await visitApp('empty');
  });

  test('should navigate to the second page and back', async ({ page }) => {
    await page.click('a.button');
    await expect(page.getByRole('heading', { name: 'Example Page B' })).toBeVisible();
    await page.click('a.button');
    await expect(page.getByRole('heading', { name: 'Example Page A' })).toBeVisible();
  });
});
