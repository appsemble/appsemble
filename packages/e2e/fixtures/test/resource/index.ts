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
   * Delete all seed resources from an app,
   * To delete all the resources of a specific type,
   * use `resourceType` optional argument.
   *
   * @param appId Id of the app to delete the resources of.
   * @param resourceType Type of the resource to delete.
   */
  deleteAllResources: (appId: number, resourceType?: string) => Promise<void>;

  /**
   * Delete a resource from an app.
   *
   * @param appId Id of the app to delete the resource of.
   * @param resourceType Type of the resource to delete.
   * @param id Id of the resource to delete.
   */
  deleteResource: (appId: number, resourceType: string, id: number) => Promise<void>;
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
      });
      expect(response.status()).toBe(201);

      const resource = (await response.json()) as Resource;
      expect(resource).not.toBeNull();
      return resource;
    });
  },

  async deleteAllResources({ request }, use) {
    await use(async (appId, resourceType) => {
      if (resourceType) {
        const queryResponse = await request.get(`/api/apps/${appId}/resources/${resourceType}`, {
          params: { $select: 'id' },
        });
        const resources = (await queryResponse.json()) as Resource[];
        const response = await request.delete(`/api/apps/${appId}/resources/${resourceType}`, {
          data: resources.map(({ id }) => id),
        });
        expect(response.status()).toBe(204);
      } else {
        const response = await request.delete(`/api/apps/${appId}/resources`);
        expect(response.status()).toBe(204);
      }
    });
  },

  async deleteResource({ request }, use) {
    await use(async (appId, resourceType, id) => {
      const response = await request.delete(`/api/apps/${appId}/resources/${resourceType}/${id}`);
      expect(response.status()).toBe(204);
    });
  },
});
