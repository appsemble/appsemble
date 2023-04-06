import { CreateResourcesWithAssetsParams } from '@appsemble/node-utils/server/types.js';
import { Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export const createResourcesWithAssets = async ({
  app,
  preparedAssets,
  resourceType,
  resources,
}: CreateResourcesWithAssetsParams): Promise<ResourceInterface[]> => {
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

  console.log('PREPARED ASSETS', preparedAssets)

  return createdResources;
};
