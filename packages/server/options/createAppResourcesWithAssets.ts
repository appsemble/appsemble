import { isDeepStrictEqual } from 'node:util';

import {
  type CreateAppResourcesWithAssetsParams,
  deleteS3Files,
  getCompressedFileMeta,
  getResourceDefinition,
  logger,
  uploadAssets,
} from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';
import { Op } from 'sequelize';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { App, getAppDB, type Resource } from '../models/index.js';
import { parseQuery, processHooks, processReferenceHooks } from '../utils/resource.js';

export async function createAppResourcesWithAssets({
  app,
  context,
  groupId,
  options,
  preparedAssets,
  resourceType,
  resources,
}: CreateAppResourcesWithAssetsParams): Promise<ResourceInterface[]> {
  const { Asset, Resource, sequelize } = await getAppDB(app.id!);
  const appMember = await getCurrentAppMember({ context, app });

  if (preparedAssets.length) {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    await uploadAssets(app.id, preparedAssets);
  }

  let createdResources: Resource[] = [];
  try {
    await sequelize.transaction(async (transaction) => {
      const resourceDefinition = getResourceDefinition(app.definition, resourceType);
      const { enforceOrderingGroupByFields, positioning } = resourceDefinition;
      createdResources = await Resource.bulkCreate(
        await Promise.all(
          resources.map(
            async ({ $clonable, $ephemeral, $expires, $seed, $thumbnails, ...data }, idx) => {
              const { query } = parseQuery({
                $filter: enforceOrderingGroupByFields
                  ?.map((item) => `${item} eq ${data[item] ? `'${data[item]}'` : null}`)
                  .join(' and '),
                resourceDefinition,
                tableName: 'Resource',
              });
              logger.verbose('Resource query');
              logger.verbose(query);

              const lastPositionResource = await Resource.findOne({
                attributes: ['Position'],
                where: {
                  type: resourceType,
                  GroupId: groupId ?? null,
                  Position: { [Op.not]: null },
                  ...(query ? { query } : {}),
                  ...($seed ? { seed: $seed } : {}),
                  ...($ephemeral ? { ephemeral: $ephemeral } : {}),
                },
                order: [['Position', 'DESC']],
                transaction,
              });
              logger.verbose('Last resource');
              logger.verbose(lastPositionResource);

              logger.verbose('Next position');
              logger.verbose(
                positioning
                  ? Number.parseFloat(String(lastPositionResource?.Position ?? 0)) + (idx + 1) * 10
                  : null,
              );
              return {
                GroupId: groupId ?? null,
                type: resourceType,
                data,
                AuthorId: appMember?.sub,
                seed: $seed,
                expires: $expires,
                clonable: $clonable,
                ephemeral: $ephemeral,
                Position: positioning
                  ? Number.parseFloat(String(lastPositionResource?.Position ?? 0)) + (idx + 1) * 10
                  : null,
              };
            },
          ),
        ),
        { transaction },
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
            // @ts-expect-error Messed up
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
  } catch (error) {
    if (preparedAssets.length) {
      await deleteS3Files(
        `app-${app.id}`,
        preparedAssets.map((asset) => asset.id),
      );
    }
    throw error;
  }

  const persistedApp = (await App.findOne({ where: { id: app.id } }))!;

  processReferenceHooks(persistedApp, createdResources[0], 'create', options, context);
  processHooks(persistedApp, createdResources[0], 'create', options, context);

  return createdResources.map((resource) => resource.toJSON());
}
