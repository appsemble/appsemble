import { expect, test } from '../../index.js';

test.describe('Organizations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/organizations');
  });

  test('should cancel the deletion of invite', async ({ page }) => {
    await page.goto('/en/organizations/appsemble/members');
    await page.click('button.button');
    await page.fill('input[name="email"]', 'e2e@appsemble.com');
    await page.click('button[type="submit"]');
    await page.click('button[title="Delete invite"]');
    await page.click('button[type="button"]:has-text("Cancel")');
    await expect(page.getByRole('paragraph', { name: 'Add new members' })).toBeHidden();
  });

  test('should delete invite', async ({ page }) => {
    await page.goto('/en/organizations/appsemble/members');
    await page.click('button[title="Delete invite"]');
    await page.click('button[type="button"]:has-text("Delete invite")');
    await expect(page.locator('table tr:has-text("e2e@appsemble.com")')).toBeHidden();
  });
});
