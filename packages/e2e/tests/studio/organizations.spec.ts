import { expect, test } from '../../index.js';

let organizationId: string;

test.describe('Organizations', () => {
  test.beforeAll(async ({ createOrganization, randomTestId }) => {
    organizationId = randomTestId();
    await createOrganization({ id: organizationId });
  });

  test.afterAll(async ({ deleteOrganization }) => {
    await deleteOrganization(organizationId);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/en/organizations/${organizationId}`);
  });

  test('should cancel the deletion of invite', async ({ page, randomTestId }) => {
    const email = `${randomTestId()}@appsemble.com`;

    await page.getByRole('link', { name: ' Members' }).click();
    await page.getByRole('button', { name: 'Add members' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.locator('form').getByRole('button', { name: 'Add members' }).click();
    const memberRow = page.getByRole('row', { name: email });
    await expect(memberRow).toBeVisible();

    await memberRow.getByRole('button', { name: '' }).click();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(memberRow).toBeVisible();
  });

  test('should delete invite', async ({ page, randomTestId }) => {
    const email = `${randomTestId()}@appsemble.com`;

    await page.getByRole('link', { name: ' Members' }).click();
    await page.getByRole('button', { name: 'Add members' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.locator('form').getByRole('button', { name: 'Add members' }).click();
    const memberRow = page.getByRole('row', { name: email });
    await expect(memberRow).toBeVisible();

    await memberRow.getByRole('button', { name: '' }).click();
    await page.getByRole('button', { name: 'Delete invite' }).click();
    await expect(page.getByText('The invite has been deleted')).toBeVisible();
    await expect(memberRow).toBeHidden();
  });
});
