import { expect, test } from '../../fixtures/test/index.js';

test.describe('Demo login', () => {
  test('should work', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('button', { name: 'Login with ...' }).click();

    await expect(page.getByRole('heading', { name: 'Example Page A' })).toBeVisible();
  });
});