import { test as base } from '@playwright/test';

import { expect } from '../../../index.js';

export interface AppCollectionFixtures {
  /**
   * Creates an app collection for the given organization
   *
   * @param organizationId ID of the organization to create the collection for
   * @param collectionName Name of the collection
   * @param expertName Name of the expert
   * @param expertDescription Description of the expert
   * @param headerImage Image that will be placed as the header of the collection
   * @param expertPhoto Photo that represents the expert
   * @param isPrivate Whether the collection should be private or not
   */
  createAppCollection: (
    organizationId: string,
    collectionName: string,
    expertName: string,
    expertDescription: string,
    headerImage: string,
    expertPhoto: string,
    isPrivate: boolean,
  ) => Promise<void>;

  /**
   * Delete an existing app collection
   *
   * @param organizationId ID of the organization which the collection belongs to
   * @param collectionName Name of the collection
   */
  deleteAppCollection: (organizationId: string, collectionName: string) => Promise<void>;
}

export const test = base.extend<AppCollectionFixtures>({
  async createAppCollection({ page }, use) {
    await use(
      async (
        organizationId,
        collectionName,
        expertName,
        expertDescription,
        headerImage,
        expertPhoto,
        isPrivate,
      ) => {
        await page.goto(`/en/organizations/${organizationId}/collections`);

        await page.getByRole('link', { name: 'App collections' }).first().click();
        await page.getByRole('button', { name: 'Create new app collection' }).click();

        await page.getByLabel('Name', { exact: true }).fill(collectionName);
        await page
          .locator('span')
          .filter({ hasText: 'Header image' })
          .first()
          .setInputFiles(headerImage);

        if (isPrivate) {
          await page.getByText('Hide this app collection from the public list').click();
        }

        await page.getByLabel('Expert name').fill(expertName);
        await page.getByLabel('Expert description').fill(expertDescription);

        await page
          .locator('span')
          .filter({ hasText: 'Expert photo' })
          .first()
          .setInputFiles(expertPhoto);

        // Avatar editor
        await page.getByRole('button', { name: 'Save' }).click();

        await page.getByRole('button', { name: 'Create app collection' }).click();

        await expect(page.getByRole('heading', { name: collectionName })).toBeVisible();
      },
    );
  },

  async deleteAppCollection({ page }, use) {
    await use(async (organizationId, collectionName) => {
      await page.goto(`/en/organizations/${organizationId}/collections`);

      await page.getByRole('link', { name: collectionName }).click();
      await page.getByRole('link', { name: 'Settings' }).click();

      await page.getByRole('button', { name: 'Delete app collection' }).click();
      await page.getByRole('button', { name: 'Delete app collection', exact: true }).click();

      await expect(page.getByRole('heading', { name: collectionName })).toBeHidden();
    });
  },
});
