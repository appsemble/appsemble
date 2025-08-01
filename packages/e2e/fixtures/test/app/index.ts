import { type App, type CreateAppOptions, type PatchAppOptions } from '@appsemble/types';
import { test as base } from '@playwright/test';
import stripIndent from 'strip-indent';

import { expect } from '../../expect/index.js';

export interface AppFixtures {
  /**
   * Create a new app for the given organization with the provided options
   *
   * @param organizationId ID of the organization to create the app for
   * @param options Options to create the app with
   * @returns The created app
   */
  createApp: (organizationId: string, yaml: string, options?: CreateAppOptions) => Promise<App>;

  /**
   * Patches the given app with the provided options
   *
   * @param appId ID of the app to patch
   * @param options What to patch in the app
   */
  patchApp: (appId: number, options: PatchAppOptions) => Promise<App>;

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
    await use(async (organizationId, yaml, options) => {
      const formData = new FormData();

      formData.append('OrganizationId', organizationId);
      formData.append('yaml', stripIndent(yaml));

      if (options) {
        for (const [option, value] of Object.entries(options)) {
          if (value !== undefined) {
            formData.append(option, String(value));
          }
        }
      }

      const response = await request.post('/api/apps', {
        multipart: formData,
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

  async patchApp({ request }, use) {
    await use(async (appId, options) => {
      const formData = new FormData();

      for (const [option, value] of Object.entries(options)) {
        if (value !== undefined) {
          formData.append(option, String(value));
        }
      }

      const response = await request.patch(`/api/apps/${appId}`, {
        multipart: formData,
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      });
      expect(response.status()).toBe(200);

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
