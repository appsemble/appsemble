import { expect, test } from '@playwright/test';

test('should allow to switch languages', async ({ page }) => {
  await page.goto('/en/apps');
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  await page.getByRole('button', { name: 'EN' }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('link', { name: 'Dutch (Nederlands)' }).click();
  // Expect should be always awaited
  await expect(page.getByRole('button', { name: 'Inloggen' })).toBeVisible();
});
