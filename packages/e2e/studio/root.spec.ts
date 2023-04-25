import { expect, test } from '@playwright/test';

test('should allow to switch languages', async ({ page }) => {
  await page.goto('/en/apps');
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  await page.getByRole('button', { name: 'EN' }).click();
  await page.click('a:has-text("Dutch (Nederlands)")');
  // Expect should be always awaited
  await expect(page.getByRole('button', { name: 'Inloggen' })).toBeVisible();
});
