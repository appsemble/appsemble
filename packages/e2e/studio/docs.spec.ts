// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore Importing this enum causes Playwright to not resolve any tests in this file
import { Permission } from '../../utils/constants/Permission.js';
// eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
// @ts-ignore Importing this from @appsemble/utils also causes the above error
import { roles } from '../../utils/constants/roles.js';
import { expect, test } from '../fixtures/test/index.js';

test.describe('Docs', () => {
  test('should render the reading guide page', async ({ page }) => {
    await page.goto('/en/docs');
    await expect(
      page.locator('.menu-list').getByRole('link', { name: 'Reading guide' }),
    ).toBeVisible();
  });

  test('should render the permissions table', async ({ page }) => {
    await page.goto('/en/docs/03-guide/organizations');
    await expect(page.getByRole('row')).toHaveText([
      ['Permissions', ...Object.keys(roles)].join(''),
      ...Object.values(Permission)
        .filter((permission) => typeof permission === 'string')
        .map((permission) => new RegExp(String(permission))),
    ]);
  });
});
