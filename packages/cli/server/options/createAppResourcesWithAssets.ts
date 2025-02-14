import { createReadStream } from 'node:fs';

import { type CreateAppResourcesWithAssetsParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { Resource } from '../models/Resource.js';

export async function createAppResourcesWithAssets({
  app,
  context,
  preparedAssets,
  resourceType,
  resources,
}: CreateAppResourcesWithAssetsParams): Promise<ResourceInterface[]> {
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

  for (const asset of preparedAssets) {
    context.appAssets.push({ ...asset, stream: createReadStream(asset.path) });
  }

  return createdResources;
}
