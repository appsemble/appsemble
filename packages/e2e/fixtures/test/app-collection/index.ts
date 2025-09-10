import { openAsBlob } from 'node:fs';

import { type AppCollection, type AppCollectionVisibility } from '@appsemble/types';
import { test as base } from '@playwright/test';

import { expect } from '../../../index.js';

export interface AppCollectionFixtures {
  /**
   * Creates an app collection for the given organization
   *
   * @param organizationId ID of the organization to create the collection for
   * @param collectionName Name of the collection
   * @param visibility Visibility of the collection
   * @param expertName Name of the expert
   * @param expertPhotoPath Path of the photo that represents the expert
   * @param headerImagePath Path of the image that will be placed as the header of the collection
   * @param expertDescription Description of the expert
   */
  createAppCollection: (
    organizationId: string,
    collectionName: string,
    visibility: AppCollectionVisibility,
    expertName: string,
    expertPhotoPath: string,
    headerImagePath: string,
    expertDescription?: string,
  ) => Promise<AppCollection>;

  /**
   * Delete an existing app collection
   *
   * @param collectionId ID of the collection to delete
   */
  deleteAppCollection: (collectionId: number) => Promise<void>;

  /**
   * Adds an app to an app collection
   *
   * @param collectionId ID of the app collection
   * @param appId ID of the app to add
   */
  addAppToAppCollection: (collectionId: number, appId: number) => Promise<void>;
}

async function getBlobFromPath(imagePath: string): Promise<Blob> {
  const extension = imagePath.split('.').pop();
  const blob = await openAsBlob(imagePath, { type: `image/${extension}` });
  return blob;
}

export const test = base.extend<AppCollectionFixtures>({
  async createAppCollection({ request }, use) {
    await use(
      async (
        organizationId,
        collectionName,
        visibility,
        expertName,
        expertPhotoPath,
        headerImagePath,
        expertDescription,
      ) => {
        const formData = new FormData();
        formData.append('name', collectionName);
        formData.append('visibility', visibility);
        formData.append('expertName', expertName);
        formData.append('expertProfileImage', await getBlobFromPath(expertPhotoPath));
        formData.append('headerImage', await getBlobFromPath(headerImagePath));

        if (expertDescription) {
          formData.append('expertDescription', expertDescription);
        }

        const response = await request.post(
          `/api/organizations/${organizationId}/app-collections`,
          {
            multipart: formData,
            headers: {
              Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
            },
          },
        );
        expect(response.status()).toBe(201);

        const appCollection = (await response.json()) as unknown as AppCollection;
        return appCollection;
      },
    );
  },

  async deleteAppCollection({ request }, use) {
    await use(async (collectionId) => {
      const response = await request.delete(`/api/app-collections/${collectionId}`, {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      });
      expect(response.status()).toBe(204);
    });
  },

  async addAppToAppCollection({ request }, use) {
    await use(async (collectionId, appId) => {
      const response = await request.post(`/api/app-collections/${collectionId}/apps`, {
        data: {
          AppId: appId,
        },
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        },
      });
      expect(response.status()).toBe(204);
    });
  },
});
