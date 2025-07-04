import { test as base, expect } from '@playwright/test';

export interface DemoAppFixtures {
  /**
   * Reseed the given app
   *
   * @param appId The ID of the app to reseed
   */
  reseedDemoApp: (appId: number) => Promise<void>;

  /**
   * Creates a new demo account with the given role and logs into the app with that account.
   *
   * > **Warning**: Expects you to be in the login screen of a demo app
   *
   * @param role The role to of the account to create
   */
  createAndLoginDemoAppMember: (role: string) => Promise<void>;
}

export const test = base.extend<DemoAppFixtures>({
  async reseedDemoApp({ browser }, use) {
    await use(async (appId) => {
      const page = await browser.newPage();

      await page.goto(`/en/apps/${appId}/-/`);
      await page.getByRole('button', { name: 'Reseed App' }).click();
      await page.getByRole('button', { name: 'Reseed', exact: true }).click();

      await page.close();
    });
  },

  async createAndLoginDemoAppMember({ page }, use) {
    await use(async (role) => {
      await page.getByTestId('app-role').selectOption(role);
      await page.getByTestId('create-account').click();

      await expect(page.getByText('Login failed')).toBeHidden();
    });
  },
});
