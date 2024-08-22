import { isDeepStrictEqual } from 'node:util';

import { type CreateAppResourcesWithAssetsParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { getUserAppAccount } from './getUserAppAccount.js';
import { App, Asset, transactional, type User } from '../models/index.js';
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
  const { user } = context;

  await (user as User)?.reload({ attributes: ['name', 'id'] });

  const appMember = await getUserAppAccount(app?.id, user?.id);

  let createdResources: Resource[];
  await transactional(async (transaction) => {
    createdResources = await Resource.bulkCreate(
      resources.map(({ $clonable, $ephemeral, $expires, $seed, $thumbnails, ...data }) => ({
        AppId: app.id,
        type: resourceType,
        data,
        AuthorId: appMember?.id,
        seed: $seed,
        expires: $expires,
        clonable: $clonable,
        ephemeral: $ephemeral,
      })),
      { logging: false, transaction },
    );

    for (const createdResource of createdResources) {
      createdResource.Author = appMember;
    }

    const cleanResources = resources.map((resource) => {
      const { $clonable, $ephemeral, $seed, $thumbnails, ...rest } = resource;
      return rest;
    });

    await Asset.bulkCreate(
      preparedAssets.map((asset) => {
        const index = cleanResources.findIndex((resource) => {
          const { $clonable, $ephemeral, $seed, $thumbnails, ...cleanAssetResource } =
            asset.resource;
          return isDeepStrictEqual(resource, cleanAssetResource);
        });
        const {
          clonable = false,
          ephemeral = false,
          id: ResourceId,
          seed = false,
        } = createdResources[index];
        return {
          ...asset,
          AppId: app.id,
          ResourceId,
          AppMemberId: appMember?.id,
          seed,
          clonable,
          ephemeral,
        };
      }),
      { logging: false, transaction },
    );
  });

  const persistedApp = await App.findOne({ where: { id: app.id } });

  processReferenceHooks(user as User, persistedApp, createdResources[0], action, options, context);
  processHooks(user as User, persistedApp, createdResources[0], action, options, context);

  return createdResources.map((resource) => resource.toJSON());
}
