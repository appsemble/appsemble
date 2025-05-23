import { expect, test } from '../../../index.js';

test.describe('App registration', () => {
  test.fixme('should work', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('button', { name: 'Login with Appsemble' }).click();

    await expect(page.getByRole('heading', { name: 'Example Page A' })).toBeVisible();
  });

  test.fixme('should handle app member email conflict', async ({ page }) => {
    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByRole('button', { name: 'Login with Appsemble' }).click();

    await expect(page.getByRole('heading', { name: 'Example Page A' })).toBeVisible();
  });
});
