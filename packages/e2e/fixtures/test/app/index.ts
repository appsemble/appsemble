import { execSync } from 'node:child_process';
import { appendFile } from 'node:fs/promises';

import {
  type App,
  type AppMessages,
  type AppsembleMessages,
  type CreateAppOptions,
  type PatchAppOptions,
} from '@appsemble/types';
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
   * Delete the given app
   *
   * @param appId ID of the app to delete
   */
  deleteApp: (appId: number) => Promise<void>;

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

  /**
   * Uploads translations for the specified language to the app
   *
   * @param appId ID of the app
   * @param language The language represented by these messages
   * @param messages The messages available to the app
   * @returns
   */
  uploadAppMessages: (
    appId: number,
    language: string,
    messages: AppsembleMessages,
  ) => Promise<AppMessages>;

  /**
   * Adds the domain of the app to the list of hosts so it can be reached in a docker environment
   *
   * @param appPath Path of the app
   * @param organizationId ID of the organization that owns the app
   */
  aliasAppDomain: (appPath: string, organizationId: string) => Promise<void>;
}

export const test = base.extend<AppFixtures>({
  async createApp({ aliasAppDomain, request }, use) {
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

      if (process.env.CI) {
        await aliasAppDomain(app.path, app.OrganizationId);
      }

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

  async deleteApp({ request }, use) {
    await use(async (appId) => {
      const response = await request.delete(`/api/apps/${appId}`, {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      });

      expect(response.status()).toBe(204);
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

  async uploadAppMessages({ request }, use) {
    await use(async (appId, language, messages) => {
      const appMessages: AppMessages = {
        language,
        messages,
      };

      const response = await request.post(`/api/apps/${appId}/messages`, {
        data: appMessages,
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      });

      expect(response.status()).toBe(201);
      return (await response.json()) as AppMessages;
    });
  },

  async aliasAppDomain({ baseURL }, use) {
    await use(async (appPath, organizationId) => {
      const appsembleIp = String(execSync("getent hosts appsemble | awk '{ print $1 }'")).trim();
      const baseUrl = new URL(baseURL!);
      const customAlias = `${appPath}.${organizationId}.${baseUrl.hostname}`;
      await appendFile('/etc/hosts', `${appsembleIp} ${customAlias}\n`);
    });
  },
});
