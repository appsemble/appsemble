import { isDeepStrictEqual } from 'node:util';

import {
  type CreateAppResourcesWithAssetsParams,
  getCompressedFileMeta,
  getResourceDefinition,
  logger,
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

  let createdResources: Resource[] = [];
  await sequelize.transaction(async (transaction) => {
    const resourceDefinition = getResourceDefinition(app.definition, resourceType);
    const { enforceOrderingGroupByFields, positioning } = resourceDefinition;
    createdResources = await Resource.bulkCreate(
      await Promise.all(
        resources.map(async ({ $clonable, $ephemeral, $expires, $seed, $thumbnails, ...data }) => {
          const { query } = parseQuery({
            $filter: enforceOrderingGroupByFields
              ?.map((item) => `${item} eq ${data[item] ? `'${data[item]}'` : null}`)
              .join(' and '),
            resourceDefinition,
            tableName: 'Resource',
          });
          logger.verbose('Resource query');
          logger.verbose(query);

          // Fetch the last position resource
          const lastPositionResource = await Resource.findOne({
            attributes: ['Position'],
            where: {
              type: resourceType,
              GroupId: groupId ?? null,
              Position: { [Op.not]: null },
              ...(query ? { query } : {}),
            },
            order: [['Position', 'DESC']],
            transaction,
          });
          logger.verbose('Last resource');
          logger.verbose(lastPositionResource);

          logger.verbose('Next position');
          logger.verbose(
            positioning
              ? Number.parseFloat(String(lastPositionResource?.Position ?? 0)) + 10
              : null,
          );
          // Return the resource object to be created
          return {
            GroupId: groupId ?? null,
            type: resourceType,
            data,
            AuthorId: appMember?.sub,
            seed: $seed,
            expires: $expires,
            clonable: $clonable,
            ephemeral: $ephemeral,
            // Database returns string values for `DECIMAL` type
            Position: positioning
              ? Number.parseFloat(String(lastPositionResource?.Position ?? 0)) + 10
              : null,
          };
        }),
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

  const persistedApp = (await App.findOne({ where: { id: app.id } }))!;

  processReferenceHooks(persistedApp, createdResources[0], 'create', options, context);
  processHooks(persistedApp, createdResources[0], 'create', options, context);

  return createdResources.map((resource) => resource.toJSON());
}
