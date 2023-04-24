import { writeFile } from 'node:fs/promises';

import { CreateAppResourcesWithAssetsParams } from '@appsemble/node-utils/server/types.js';
import { Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export const createAppResourcesWithAssets = async ({
  app,
  context,
  preparedAssets,
  resourceType,
  resources,
}: CreateAppResourcesWithAssetsParams): Promise<ResourceInterface[]> => {
  const existingResources = await Resource.findAll({}, resourceType);
  const firstIndex = existingResources.length;

  const createdResources = await Resource.bulkCreate(
    resources.map((resource, index) => ({
      id: firstIndex + index,
      AppId: app.id,
      ...resource,
    })),
    resourceType,
  );

  console.log('PREPARED ASSETS', preparedAssets);

  const assetPromises = preparedAssets.map(async (asset) => {
    context.appAssets.push(asset);
    await writeFile(asset.filename, asset.data);
  });

  await Promise.all(assetPromises);

  return createdResources;
};
