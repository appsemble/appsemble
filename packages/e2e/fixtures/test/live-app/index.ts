import { type App } from '@appsemble/types';
import { type APIRequestContext, test as base } from '@playwright/test';

import { expect } from '../../expect/index.js';

export interface LiveAppFixtures {
  /**
   * Visit an app.
   *
   * @param appIdentifier Used to find the app to visit.
   *   Can be either the app's **ID** as number, or the app's **path** as string
   * @returns URL of the live app
   */
  visitApp: (appIdentifier: number | string) => Promise<string>;

  /**
   * Login to an app with the Appsemble OAuth2 flow.
   */
  loginAppAppsembleOAuth: () => Promise<void>;

  /**
   * Logs into an app using the 'Appsemble Login' flow with the provided App Member credentials
   *
   * > **Warning:** Expects the test to be at the login screen of an app that has the "Display
   * Appsemble login method" option enabled.
   *
   * @param email Email of the App Member to log in as
   * @param password Password of the App Member to log in as
   */
  loginAppAppsembleLogin: (email: string, password: string) => Promise<void>;

  /**
   * Gives the app consent to perform actions on the app member's behalf
   *
   * This makes it so the consent screen doesn't pop up when trying to log in
   *
   * @param appId ID of the app to give consent to
   */
  giveAppConsent: (appId: number) => Promise<void>;

  /**
   * Gets the URL to visit the live app
   *
   * @param appId ID of the app
   */
  getLiveAppURL: (appId: number) => Promise<string>;
}

async function getAppId(appPath: string, request: APIRequestContext): Promise<number> {
  const apps: App[] = await (await request.get('/api/apps')).json();
  const appId = apps.find(({ path }) => path === appPath)?.id;
  expect(appId).not.toBeUndefined();

  return appId!;
}

export const test = base.extend<LiveAppFixtures>({
  async visitApp({ getLiveAppURL, page, request }, use) {
    await use(async (appIdentifier) => {
      const url = await (typeof appIdentifier === 'number'
        ? getLiveAppURL(appIdentifier)
        : getLiveAppURL(await getAppId(appIdentifier, request)));

      await page.goto(url);
      return url;
    });
  },

  async loginAppAppsembleOAuth({ page }, use) {
    await use(async () => {
      await page.waitForURL('**/Login**');
      const params = new URLSearchParams(page.url().split('Login?')[1]);
      const redirect = params.get('redirect');

      await page.getByTestId('login-with-appsemble').click();

      if (!redirect) {
        return;
      }

      await page.waitForURL(`**${redirect}`);
    });
  },

  async loginAppAppsembleLogin({ page }, use) {
    await use(async (email, password) => {
      await page.waitForURL('**/Login**');

      await page.getByTestId('email').fill(email);
      await page.getByTestId('password').fill(password);
      await page.getByTestId('login').click();

      await expect(page.getByText('Login failed')).toBeHidden();
    });
  },

  async giveAppConsent({ getLiveAppURL, request }, use) {
    await use(async (appId) => {
      const url = await getLiveAppURL(appId);
      const response = await request.post(
        `/api/users/current/auth/oauth2/apps/${appId}/consent/agree`,
        {
          data: {
            redirectUri: url,
            scope: 'openid',
          },
          headers: {
            Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          },
        },
      );
      expect(response.status()).toBe(201);
    });
  },

  async getLiveAppURL({ baseURL, request }, use) {
    await use(async (appId) => {
      expect(baseURL).not.toBeUndefined();
      const response = await request.get(`/api/apps/${appId}`);
      expect(response.status()).toBe(200);

      const { OrganizationId, domain, path } = (await response.json()) as App;
      expect(path).not.toBeNull();

      const baseUrl = new URL(baseURL!);
      const origin = domain || `${path}.${OrganizationId}.${baseUrl.host}`;
      return `${baseUrl.protocol}//${origin}`;
    });
  },
});
