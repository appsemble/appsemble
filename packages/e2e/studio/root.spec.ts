import { expect, test } from '@playwright/test';

test('should allow to switch languages', async ({ page }) => {
  await page.goto('/en/apps');
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  await page.locator('button', { hasText: /EN/ }).click();
  await page.locator('button:has-text("Dutch (Nederlands)")').click();
  // Expect should be always awaited
  await expect(page.getByRole('button', { name: 'Inloggen' })).toBeVisible();
});
