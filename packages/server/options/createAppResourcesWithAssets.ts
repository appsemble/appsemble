import { isDeepStrictEqual } from 'node:util';

import {
  type CreateAppResourcesWithAssetsParams,
  getCompressedFileMeta,
} from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';
import { Op } from 'sequelize';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { App, Asset, transactional } from '../models/index.js';
import { Resource } from '../models/Resource.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';

export async function createAppResourcesWithAssets({
  app,
  context,
  groupId,
  options,
  positioning,
  preparedAssets,
  resourceType,
  resources,
}: CreateAppResourcesWithAssetsParams): Promise<ResourceInterface[]> {
  const appMember = await getCurrentAppMember({ context });

  let createdResources: Resource[];
  await transactional(async (transaction) => {
    let lastPositionResource: Resource | undefined;
    if (positioning) {
      lastPositionResource = await Resource.findOne({
        attributes: ['Position'],
        where: { AppId: app.id, type: resourceType, position: { [Op.not]: null } },
        order: [['Position', 'DESC']],
      });
    }
    createdResources = await Resource.bulkCreate(
      resources.map(({ $clonable, $ephemeral, $expires, $seed, $thumbnails, ...data }, index) => ({
        AppId: app.id,
        GroupId: groupId ?? null,
        type: resourceType,
        data,
        AuthorId: appMember?.sub,
        seed: $seed,
        expires: $expires,
        clonable: $clonable,
        ephemeral: $ephemeral,
        Position: lastPositionResource ? lastPositionResource.Position + index : null,
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
          ...getCompressedFileMeta(asset),
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
  });

  const persistedApp = await App.findOne({ where: { id: app.id } });

  processReferenceHooks(persistedApp, createdResources[0], 'create', options, context);
  processHooks(persistedApp, createdResources[0], 'create', options, context);

  return createdResources.map((resource) => resource.toJSON());
}
