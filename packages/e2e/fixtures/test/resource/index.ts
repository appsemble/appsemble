import { type Resource } from '@appsemble/types';
import { test as base } from '@playwright/test';

import { expect } from '../../expect/index.js';

export interface ResourceFixtures {
  /**
   * Create resource from JSON input.
   *
   * @param appId The ID of the app.
   * @param type The resource type.
   * @param input The resource JSON input.
   * @param assets Any assets that need to be linked to a field
   * @returns The created resource
   */
  createResource: (
    appId: number,
    type: string,
    input: unknown,
    assets?: Blob[],
  ) => Promise<Resource>;

  /**
   * Delete all resources from an app.
   *
   * @param appId Id of the app to delete the resources of.
   */
  deleteAllResources: (appId: number) => Promise<void>;
}

export const test = base.extend<ResourceFixtures>({
  async createResource({ request }, use) {
    await use(async (appId: number, type: string, input: unknown, assets?: Blob[]) => {
      const formData = new FormData();

      formData.append('resource', JSON.stringify(input));

      if (assets) {
        for (const asset of assets) {
          formData.append('assets', asset);
        }
      }

      const response = await request.post(`/api/apps/${appId}/resources/${type}`, {
        multipart: formData,
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
