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
    await page.waitForSelector('text="The open source low-code app building platform"');
    await page.waitForSelector('text="Apps"');
    await page.waitForSelector('text="Blocks"');
    await page.waitForSelector('text="Unlittered"');
    await page.waitForSelector('text="action-button"');
  });

  test('should cancel the deletion of invite', async ({ login, page }) => {
    await login('/en/organizations/appsemble/members');
    await page.waitForSelector('text="Organization Members"');
    await page.click('button.button');
    await page.waitForSelector('text="Add new members"');
    await page.fill('input[name="email"]', 'e2e@appsemble.com');
    await page.click('button[type="submit"]');
    await page.waitForSelector('table tr:has-text("e2e@appsemble.com")');
    await page.click('button[title="Delete invite"]');
    await page.waitForSelector('text="Delete invite"');
    await page.click('button[type="button"]:has-text("Cancel")');
  });

  test('should delete invite', async ({ login, page }) => {
    await login('/en/organizations/appsemble/members');
    await page.waitForSelector('text="Organization Members"');
    await page.waitForSelector('table tr:has-text("e2e@appsemble.com")');
    await page.click('button[title="Delete invite"]');
    await page.waitForSelector('text="Delete invite"');
    await page.click('button[type="button"]:has-text("Delete invite")');
    await expect(page.locator('table tr:has-text("e2e@appsemble.com")')).toBeHidden();
  });
});
