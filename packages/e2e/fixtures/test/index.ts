import { createFormData } from '@appsemble/node-utils';
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
  return apps[index].id;
}

interface Fixtures {
  /**
   * Perform a login in Appsemble Studio using a user flow.
   *
   * @param redirect The URL to navigate to after logging in.
   */
  login: (redirect: string) => Promise<void>;

  /**
   * Perform a logout in Appsemble Studio.
   */
  logout: () => Promise<void>;

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
      const baseUrl = new URL(baseURL);
      await page.goto(`${baseUrl.protocol}//${appPath}.appsemble.${baseUrl.host}`);
    });
  },

  async login({ page }, use) {
    await use(async (redirect) => {
      const queryParams = new URLSearchParams({ redirect });
      await page.goto(`/en/login?${queryParams}`);

      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.appsemble-loader', { state: 'hidden' });

      await page.getByTestId('email').fill(process.env.BOT_ACCOUNT_EMAIL);
      await page.getByTestId('password').fill(process.env.BOT_ACCOUNT_PASSWORD);
      await page.getByTestId('login').click();
      await expect(page).toHaveURL(redirect);
    });
  },

  async logout({ page }, use) {
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
      await page.waitForSelector('.appsemble-loader', { state: 'hidden' });
      await page.getByTestId('login-with-appsemble').click();

      const emailInput = page.getByTestId('email');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.appsemble-loader', { state: 'hidden' });

      if (await emailInput.isVisible()) {
        await page.getByTestId('email').fill(process.env.BOT_ACCOUNT_EMAIL);
        await page.getByTestId('password').fill(process.env.BOT_ACCOUNT_PASSWORD);
        await page.getByTestId('login').click();

        const appId = await getAppId(page);
        const response = await page.waitForResponse(
          `/api/users/current/auth/oauth2/apps/${appId}/consent/verify`,
        );
        if (response.ok()) {
          return;
        }
        const responseBody = await response.text();
        if (responseBody.includes('User has not agreed to the requested scopes')) {
          await page.getByTestId('allow').click();
          return;
        }
      }
      await page.waitForSelector('.appsemble-loader', { state: 'hidden' });
      const allowButton = page.getByTestId('allow');

      if (await allowButton.isVisible()) {
        await allowButton.click();
      }
    });
  },

  // TODO: handle this by seeding an app beforehand with logins configured
  async createTestApp({}, use) {
    await use(async (organization, yaml) => {
      const response = await axios.post<App>(
        '/api/apps',
        createFormData({
          OrganizationId: organization.toLowerCase(),
          yaml: stripIndent(yaml),
        }),
      );
      return response.data;
    });
  },
});

export { expect };
