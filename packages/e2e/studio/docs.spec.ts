import { OrganizationPermission, predefinedOrganizationRoles } from '@appsemble/types';

import { expect, test } from '../fixtures/test/index.js';

test.describe('Docs', () => {
  test('should render the reading guide page', async ({ page }) => {
    await page.goto('/en/docs');
    await expect(
      page.locator('.menu-list').getByRole('link', { name: 'Reading guide' }),
    ).toBeVisible();
  });

  test('should render the permissions table', async ({ page }) => {
    await page.goto('/en/docs/guides/organizations');
    await expect(page.getByRole('row')).toHaveText([
      ['Permissions', ...predefinedOrganizationRoles].join(''),
      ...Object.values(OrganizationPermission)
        .filter((permission) => typeof permission === 'string')
        .map((permission) => new RegExp(String(permission))),
    ]);
  });
});
