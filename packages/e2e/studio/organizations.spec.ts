import { expect, test } from '../fixtures/test/index.js';

test.describe('Organizations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/organizations');
  });

  test('should render a list of organizations', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Appsemble appsemble' })).toBeVisible();
  });

  test('should link to organization details', async ({ page }) => {
    await page.getByRole('link', { name: 'Appsemble appsemble' }).click();
    await expect(page.getByText('The open source low-code app building platform')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Apps', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Blocks', exact: true })).toBeVisible();
    await expect(page.getByText('Unlittered')).toBeVisible();
    await expect(page.getByText('action-button')).toBeVisible();
  });

  test('should cancel the deletion of invite', async ({ login, page }) => {
    await login('/en/organizations/appsemble/members');
    await page.click('button.button');
    await page.fill('input[name="email"]', 'e2e@appsemble.com');
    await page.click('button[type="submit"]');
    await page.click('button[title="Delete invite"]');
    await page.click('button[type="button"]:has-text("Cancel")');
    await expect(page.getByRole('paragraph', { name: 'Add new members' })).toBeHidden();
  });

  test('should delete invite', async ({ login, page }) => {
    await login('/en/organizations/appsemble/members');
    await page.click('button[title="Delete invite"]');
    await page.click('button[type="button"]:has-text("Delete invite")');
    await expect(page.locator('table tr:has-text("e2e@appsemble.com")')).toBeHidden();
  });
});
