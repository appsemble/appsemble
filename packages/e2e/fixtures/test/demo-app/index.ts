import { test as base } from '@playwright/test';

export interface DemoAppFixtures {
  /**
   * Reseed the given app
   *
   * @param appId The ID of the app to reseed
   */
  reseedDemoApp: (appId: number) => Promise<void>;

  /**
   * Login to an Appsemble demo app.
   *
   * @param role The role to login in as.
   */
  loginDemoApp: (role: string) => Promise<void>;
}

export const test = base.extend<DemoAppFixtures>({
  async reseedDemoApp({ browser }, use) {
    await use(async (appId: number) => {
      const page = await browser.newPage();

      await page.goto(`/en/apps/${appId}/-/`);
      await page.getByRole('button', { name: 'Reseed App' }).click();
      await page.getByRole('button', { name: 'Reseed', exact: true }).click();

      await page.close();
    });
  },

  async loginDemoApp({ page }, use) {
    await use(async (role: string) => {
      const btn = page.getByTestId('create-account');
      if (await btn.isVisible()) {
        await page.getByTestId('app-role').selectOption(role);
        await btn.click();
      }
    });
  },
});
