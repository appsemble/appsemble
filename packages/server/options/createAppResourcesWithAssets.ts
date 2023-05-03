import { type CreateAppResourcesWithAssetsParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { App, Asset, transactional } from '../models/index.js';
import { Resource } from '../models/Resource.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export async function createAppResourcesWithAssets({
  action,
  app,
  context,
  options,
  preparedAssets,
  resourceType,
  resources,
}: CreateAppResourcesWithAssetsParams): Promise<ResourceInterface[]> {
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

  const persistedApp = await App.findOne({ where: { id: app.id } });

  processReferenceHooks(context.user, persistedApp, createdResources[0], action, options, context);
  processHooks(context.user, persistedApp, createdResources[0], action, options, context);

  return createdResources.map((resource) => resource.toJSON());
}
