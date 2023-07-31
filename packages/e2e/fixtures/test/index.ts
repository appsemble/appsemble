import { test as base, expect } from '@playwright/test';

interface Fixtures {
  /**
   * Perform a login in Appsemble Studio using a user flow.
   *
   * @param redirect The URL to navigate to after logging in.
   */
  login: (redirect: string) => Promise<void>;

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

      await page.fill('#email', process.env.BOT_ACCOUNT_EMAIL);
      await page.fill('#password', process.env.BOT_ACCOUNT_PASSWORD);
      await page.click('[type="submit"]');
      await expect(page).toHaveURL(redirect);
    });
  },

  async loginApp({ page }, use) {
    await use(async () => {
      await page.waitForSelector('.appsemble-loader', { state: 'hidden' });
      await page.click('.appsemble-login > button');

      const emailInput = page.locator('#email');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('.appsemble-loader', { state: 'hidden' });

      if (await emailInput.isVisible()) {
        await page.fill('#email', 'bot@appsemble.com');
        await page.fill('#password', process.env.BOT_ACCOUNT_PASSWORD);
        await page.click('button[type="submit"]');

        const response = await page.waitForResponse('/api/oauth2/consent/verify');
        if (response.ok()) {
          return;
        }
        const responseBody = await response.text();
        if (responseBody.includes('User has not agreed to the requested scopes')) {
          await page.click('.has-text-centered > .button.is-primary');
          return;
        }
      }
      await page.waitForLoadState('domcontentloaded');
      const allowButton = await page.$('button:has-text("Allow")');

      if (allowButton) {
        await allowButton.click();
      }
    });
  },
});

export { expect };
