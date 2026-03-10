import { AppPermission, predefinedAppRoles } from '@appsemble/lang-sdk';
import { OrganizationPermission, predefinedOrganizationRoles } from '@appsemble/types';

import { expect, baseTest as test } from '../../index.js';

test.describe('Docs', () => {
  test('should render the index page', async ({ page }) => {
    await page.goto('/en/docs');
    await expect(
      page.locator('.menu-list').getByRole('link', { name: 'What is Appsemble?' }),
    ).toBeVisible();
  });

  test('should render the permissions table', async ({ page }) => {
    await page.goto('/en/docs/studio/organizations');
    await expect(page.getByRole('row')).toHaveText([
      ['Permissions', ...predefinedOrganizationRoles].join(''),
      ...Object.values(OrganizationPermission)
        .filter((permission) => typeof permission === 'string')
        .map((permission) => new RegExp(String(permission))),
    ]);
  });

  test('should render the app member permissions table', async ({ page }) => {
    await page.goto('/en/docs/app/security');
    await expect(page.getByRole('row')).toHaveText([
      ['Permissions', ...predefinedAppRoles].join(''),
      ...Object.values(AppPermission)
        .filter((permission) => !permission.startsWith('$resource:all:own'))
        .filter((permission) => typeof permission === 'string')
        .map((permission) => new RegExp(`\\${String(permission)}`)),
    ]);
  });
});
