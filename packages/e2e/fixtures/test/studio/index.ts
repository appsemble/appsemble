import { test as base, expect, type Page } from '@playwright/test';

export interface StudioFixtures {
  /**
   * Log into Appsemble studio as a user
   *
   * @param email Email address of the account to log in with
   * @param password Password of the account
   * @param saveInStorageState Whether or not to save the authenticated state as reusable storage
   *   state (see: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests)
   * @returns The user's access token
   */
  loginUser: (email: string, password: string, saveInStorageState?: boolean) => Promise<string>;

  /**
   * Log into Appsemble studio as a user using the given page
   *
   * @param email Email address of the account to log in with
   * @param password Password of the account
   * @param page Page to login with
   * @param saveInStorageState Whether or not to save the authenticated state as reusable storage
   *   state (see: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests)
   * @returns The user's access token
   */
  loginUserOnPage: (
    email: string,
    password: string,
    page: Page,
    saveInStorageState?: boolean,
  ) => Promise<string>;

  /**
   * Log the worker out of their current user account
   */
  logoutUser: () => Promise<void>;
}

export const test = base.extend<StudioFixtures>({
  async loginUser({ loginUserOnPage, page }, use) {
    await use(async (email, password, saveInStorageState = false) => {
      const accessToken = await loginUserOnPage(email, password, page, saveInStorageState);
      return accessToken;
    });
  },

  async loginUserOnPage({}, use) {
    await use(async (email, password, page, saveInStorageState = false) => {
      let accessToken = '';
      // Get the access token from the "login" response
      page.on('response', async (response) => {
        if (!response.url().endsWith('/api/auth/email/login')) {
          return;
        }
        accessToken = (await response.json()).access_token as string;
        expect(accessToken).toStrictEqual(expect.any(String));
      });

      await page.goto('/en/login');

      await page.getByTestId('email').fill(email);
      await page.getByTestId('password').fill(password);
      await page.getByTestId('login').click();
      await page.waitForResponse('**/api/auth/email/login');

      await expect(page.getByText('Login failed')).toBeHidden();

      if (saveInStorageState) {
        await page.context().storageState({ path: '.auth/user.json' });
      }

      return accessToken;
    });
  },

  async logoutUser({ page }, use) {
    await use(async () => {
      await page.getByRole('button').nth(1).click();
      await page.getByRole('button', { name: 'Logout' }).click();
    });
  },
});
