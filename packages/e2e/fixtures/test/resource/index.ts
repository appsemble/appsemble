import { type Resource } from '@appsemble/types';
import { test as base } from '@playwright/test';

import { expect } from '../../expect/index.js';

export interface ResourceFixtures {
  /**
   * Create resource(s) from JSON input.
   *
   * @param appId The ID of the app.
   * @param type The resource type.
   * @param input The resource JSON input.
   */
  createResource: (appId: number, type: string, input: unknown) => Promise<Resource>;

  /**
   * Delete all resources from an app.
   *
   * @param appId Id of the app to delete the resources of.
   */
  deleteAllResources: (appId: number) => Promise<void>;
}

export const test = base.extend<ResourceFixtures>({
  async createResource({ request }, use) {
    await use(async (appId: number, type: string, input: unknown) => {
      const response = await request.post(`/api/apps/${appId}/resources/${type}`, {
        data: JSON.stringify(input),
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      });
      expect(response.status()).toBe(201);

      const resource = (await response.json()) as Resource;
      expect(resource).not.toBeNull();
      return resource;
    });
  },

  async deleteAllResources({ request }, use) {
    await use(async (appId) => {
      const response = await request.delete(`/api/apps/${appId}/resources`, {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      });
      expect(response.status()).toBe(204);
    });
  },
});
