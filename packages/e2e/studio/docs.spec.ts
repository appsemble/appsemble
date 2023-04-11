import { expect, test } from '@playwright/test';

test('should render the reading guide page', async ({ page }) => {
  await page.goto('/en/docs');
  await expect(
    page.locator('.menu-list').getByRole('link', { name: 'Reading guide' }),
  ).toBeVisible();
});
