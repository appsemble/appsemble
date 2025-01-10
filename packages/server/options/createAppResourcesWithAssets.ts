import { isDeepStrictEqual } from 'node:util';

import { type CreateAppResourcesWithAssetsParams } from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { App, Asset, transactional } from '../models/index.js';
import { Resource } from '../models/Resource.js';
import { getCompressedFileMeta, uploadAssetFile } from '../utils/assets.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export async function createAppResourcesWithAssets({
  app,
  context,
  groupId,
  options,
  preparedAssets,
  resourceType,
  resources,
}: CreateAppResourcesWithAssetsParams): Promise<ResourceInterface[]> {
  const appMember = await getCurrentAppMember({ context });

  let createdResources: Resource[];
  await transactional(async (transaction) => {
    createdResources = await Resource.bulkCreate(
      resources.map(({ $clonable, $ephemeral, $expires, $seed, $thumbnails, ...data }) => ({
        AppId: app.id,
        GroupId: groupId ?? null,
        type: resourceType,
        data,
        AuthorId: appMember?.sub,
        seed: $seed,
        expires: $expires,
        clonable: $clonable,
        ephemeral: $ephemeral,
      })),
      { logging: false, transaction },
    );

    for (const createdResource of createdResources) {
      createdResource.AuthorId = appMember?.sub;
    }

    const cleanResources = resources.map((resource) => {
      const { $clonable, $ephemeral, $seed, $thumbnails, ...rest } = resource;
      return rest;
    });

    const createdAssets = await Asset.bulkCreate(
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
          GroupId: groupId ?? null,
          ResourceId,
          AppMemberId: appMember?.sub,
          seed,
          clonable,
          ephemeral,
        };
      }),
      { logging: false, transaction },
    );

    for (const asset of preparedAssets) {
      await uploadAssetFile(app.id, asset.id, {
        mime: asset.mime,
        path: asset.path,
      });
    }

    for (const asset of createdAssets) {
      await asset.update(getCompressedFileMeta(asset), { transaction });
    }
  });

  const persistedApp = await App.findOne({ where: { id: app.id } });

  processReferenceHooks(persistedApp, createdResources[0], 'create', options, context);
  processHooks(persistedApp, createdResources[0], 'create', options, context);

  return createdResources.map((resource) => resource.toJSON());
}
