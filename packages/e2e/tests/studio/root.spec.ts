import { expect, authenticatedTest as test } from '../../index.js';

test('should allow to switch languages', async ({ page }) => {
  await page.goto('/en/apps');
  await page.locator('button', { hasText: /EN/ }).click();
  await page.locator('button:has-text("Dutch (Nederlands)")').click();

  await expect(page.getByRole('heading', { name: 'Alle Apps', exact: true })).toBeVisible();
});
