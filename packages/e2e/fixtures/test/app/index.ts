import { type App } from '@appsemble/types';
import { test as base } from '@playwright/test';
import stripIndent from 'strip-indent';

import { expect } from '../../expect/index.js';

export interface AppFixtures {
  /**
   * Create an app.
   */
  createApp: (organization: string, yaml: string) => Promise<App>;

  /**
   * Set the role of the user.
   *
   * Note that this requires the user to be logged in to the studio.
   *
   * @param appId The ID of the app to set the role for.
   * @param role The role to set.
   */
  changeAppMemberRole: (appId: number, role: string) => Promise<void>;

  /**
   * Gets the ID of an app
   *
   * @param appPath Path of the app
   * @returns ID of the app
   */
  getAppId: (appPath: string) => Promise<number>;
}

export const test = base.extend<AppFixtures>({
  async createApp({ request }, use) {
    await use(async (organization, yaml) => {
      const formData = new FormData();

      formData.append('OrganizationId', organization.toLowerCase());
      formData.append('yaml', stripIndent(yaml));

      const response = await request.post('/api/apps', {
        data: formData,
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      });
      expect(response.status()).toBe(201);

      const app = (await response.json()) as App;
      expect(app).not.toBeNull();
      return app;
    });
  },

  async changeAppMemberRole({ browser }, use) {
    await use(async (appId, role) => {
      const page = await browser.newPage();

      await page.goto(`/en/apps/${appId}/-/users`);
      const select = page.locator('tr', { hasText: 'It’s you!' }).locator('select[class=""]');
      await select.selectOption(role);

      await page.close();
    });
  },

  async getAppId({ request }, use) {
    await use(async (appPath) => {
      const apps: App[] = await (await request.get('/api/apps')).json();
      const appId = apps.find(({ path }) => path === appPath)?.id;
      expect(appId).not.toBeUndefined();

      return appId!;
    });
  },
});
