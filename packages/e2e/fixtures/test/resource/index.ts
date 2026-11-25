import { type Resource } from '@appsemble/types';
import { test as base, type Response } from '@playwright/test';

import { expect } from '../../expect/index.js';
import { type TrackedResource } from './types.js';

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

  /**
   * Creates a resource for the given app.
   *
   * The resource is automatically deleted after the test by default.
   *
   * @param appId ID of the app which the resource belongs to
   * @param type Resource type
   * @param input Resource data
   * @returns Created resource
   */
  createTestResource: (appId: number, type: string, input: unknown) => Promise<Resource>;

  /**
   * Waits until resources created by the browser have been added to `trackedResources`.
   */
  trackCreatedResources: () => Promise<void>;

  /**
   * Whether to track resources created through the browser during the current test.
   */
  trackBrowserResources: boolean;

  /**
   * Whether to delete tracked resources after the current test.
   */
  autoCleanupResources: boolean;

  /**
   * List of resources created during the current test
   */
  trackedResources: TrackedResource[];

  /**
   * Deletes all the resources that are being tracked in the `trackedResources` list.
   *
   * Runs automatically after the test completes if `autoCleanupResources` is enabled.
   */
  cleanupResources: null;
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

  async trackedResources({}, use) {
    await use([]);
  },

  async createTestResource({ createResource, trackedResources }, use) {
    await use(async (appId, type, input) => {
      const resource = await createResource(appId, type, input);

      trackedResources.push({
        appId,
        type,
        id: resource.id,
      });

      return resource;
    });
  },

  trackBrowserResources: [false, { option: true }],

  autoCleanupResources: [true, { option: true }],

  trackCreatedResources: [
    async ({ page, trackBrowserResources, trackedResources }, use) => {
      if (!trackBrowserResources) {
        await use(() => Promise.resolve());
        return;
      }

      const pendingResponses: Promise<void>[] = [];

      function onResponse(response: Response): void {
        if (response.request().method() !== 'POST' || !response.ok()) {
          return;
        }

        const url = new URL(response.url());
        const match = /^\/api\/apps\/(\d+)\/resources\/([^/]+)$/.exec(url.pathname);
        if (!match) {
          return;
        }

        const [, appId, type] = match;
        const pendingResponse = response.json().then((resource: Resource) => {
          const trackedResource = {
            appId: Number(appId),
            id: resource.id,
            type: decodeURIComponent(type),
          };

          if (
            !trackedResources.some(
              (entry) =>
                entry.appId === trackedResource.appId &&
                entry.id === trackedResource.id &&
                entry.type === trackedResource.type,
            )
          ) {
            trackedResources.push(trackedResource);
          }
        });

        pendingResponses.push(pendingResponse);
      }

      async function waitForResponses(): Promise<void> {
        await Promise.all(pendingResponses);
      }

      page.on('response', onResponse);
      await use(waitForResponses);
      page.off('response', onResponse);
    },
    { auto: true },
  ],

  cleanupResources: [
    async (
      { autoCleanupResources, deleteResource, trackCreatedResources, trackedResources },
      use,
    ) => {
      await use(null);

      if (!autoCleanupResources) {
        return;
      }

      await trackCreatedResources();

      for (const resource of trackedResources) {
        await deleteResource(resource.appId, resource.type, resource.id);
      }
    },
    { auto: true },
  ],
});
