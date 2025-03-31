import { type App } from '@appsemble/types';
import { test as base, expect, type Page } from '@playwright/test';
import axios from 'axios';
import stripIndent from 'strip-indent';

/**
 * Get the appId.
 *
 * TODO: figure out a better way of getting the app id.
 *
 * @param page The playwright page.
 * @returns appId The app id.
 */
export async function getAppId(page: Page): Promise<number> {
  const [path] = new URL(page.url()).hostname.split('.');
  const response = await fetch('/api/apps');
  const apps: App[] = await response.json();
  const index = apps.findIndex((app) => app.path === path);
  return apps[index].id!;
}

interface Fixtures {
  /**
   * Perform a login in Appsemble Studio using a user flow.
   *
   * @param redirect The URL to navigate to after logging in.
   */
  loginStudio: (redirect: string) => Promise<void>;

  /**
   * Perform a logout in Appsemble Studio.
   */
  logoutStudio: () => Promise<void>;

  /**
   * Visit an app.
   *
   * @param appPath The app path name.
   */
  visitApp: (appPath: string) => Promise<void>;

  /**
   * Login to an Appsemble app.
   */
  loginApp: () => Promise<void>;

  /**
   * Create a test app.
   */
  createTestApp: (organization: string, yaml: string) => Promise<App>;
}

export const test = base.extend<Fixtures>({
  async visitApp({ baseURL, page }, use) {
    await use(async (appPath) => {
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      const baseUrl = new URL(baseURL);
      await page.goto(`${baseUrl.protocol}//${appPath}.appsemble.${baseUrl.host}`);
    });
  },

  async loginStudio({ page }, use) {
    await use(async (redirect) => {
      const queryParams = new URLSearchParams({ redirect });
      await page.goto(`/en/login?${queryParams}`);

      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      await page.getByTestId('email').fill(process.env.BOT_ACCOUNT_EMAIL);
      // @ts-expect-error 2345 argument of type is not assignable to parameter of type
      // (strictNullChecks)
      await page.getByTestId('password').fill(process.env.BOT_ACCOUNT_PASSWORD);
      await page.getByTestId('login').click();
      await page.waitForURL(redirect);

      await expect(page).toHaveURL(redirect);
    });
  },

  async logoutStudio({ page }, use) {
    await use(async () => {
      await page
        .locator(
          'div.navbar-item.has-dropdown.is-right > button.navbar-link:has(img[alt="Profile Picture"])',
        )
        .click();
      await page.getByRole('button', { name: 'Logout' }).click();
    });
  },

  async loginApp({ page }, use) {
    await use(async () => {
      await page.getByTestId('login-with-appsemble').click();
      await page.addLocatorHandler(page.getByTestId('allow'), async () => {
        await page.getByTestId('allow').click();
      });
    });
  },

  // TODO: handle this by seeding an app beforehand with logins configured
  async createTestApp({}, use) {
    await use(async (organization, yaml) => {
      const formData = new FormData();

      formData.append('OrganizationId', organization.toLowerCase());
      formData.append('yaml', stripIndent(yaml));

      const response = await axios.post<App>('/api/apps', formData);
      return response.data;
    });
  },
});

export { expect };
