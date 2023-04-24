import { CreateAppResourcesWithAssetsParams } from '@appsemble/node-utils/server/types.js';
import { Resource as ResourceInterface } from '@appsemble/types';

import { App, Asset, transactional } from '../models/index.js';
import { Resource } from '../models/Resource.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export const createAppResourcesWithAssets = async ({
  action,
  app,
  context,
  preparedAssets,
  resourceType,
  resources,
}: CreateAppResourcesWithAssetsParams): Promise<ResourceInterface[]> => {
  await context.user?.reload({ attributes: ['name'] });

  let createdResources: Resource[];
  await transactional(async (transaction) => {
    createdResources = await Resource.bulkCreate(
      resources.map(({ $expires, ...data }) => ({
        AppId: app.id,
        type: resourceType,
        data,
        AuthorId: context.user?.id,
        expires: $expires,
      })),
      { logging: false, transaction },
    );

    for (const createdResource of createdResources) {
      createdResource.Author = context.user;
    }

    await Asset.bulkCreate(
      preparedAssets.map((asset) => {
        const index = resources.indexOf(asset.resource);
        const { id: ResourceId } = createdResources[index];
        return {
          ...asset,
          AppId: app.id,
          ResourceId,
          UserId: context.user?.id,
        };
      }),
      { logging: false, transaction },
    );
  });

  processReferenceHooks(context.user, { id: app.id } as App, createdResources[0], action);
  processHooks(context.user, { id: app.id } as App, createdResources[0], action);

  return createdResources.map((resource) => resource.toJSON());
};
