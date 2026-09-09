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
import { literal, Op, type Transaction, type UniqueConstraintError } from 'sequelize';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { App, getAppDB, type Resource } from '../models/index.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';
import {
  isUniqueConstraintErrorLike,
  throwResourceUniqueConstraintKoaErrorForResource,
} from '../utils/resourceUniqueIndexes.js';

export async function createAppResourcesWithAssets({
  app,
  context,
  groupId,
  options,
  preparedAssets,
  resourceType,
  resources,
  transaction: publicationTransaction,
}: CreateAppResourcesWithAssetsParams & { transaction?: Transaction }): Promise<
  ResourceInterface[]
> {
  const { Asset, Resource, sequelize } = await getAppDB(app.id!);
  const appMember = await getCurrentAppMember({ context, app });
  const resourceDefinition = getResourceDefinition(app.definition, resourceType);

  if (preparedAssets.length) {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    await uploadAssets(app.id, preparedAssets);
  }

  let createdResources: Resource[] = [];
  try {
    const createResources = async (transaction: Transaction): Promise<void> => {
      const { enforceOrderingGroupByFields, positioning } = resourceDefinition;
      createdResources = await Resource.bulkCreate(
        await Promise.all(
          resources.map(
            // Exclude id from body
            async ({ $clonable, $ephemeral, $expires, $seed, $thumbnails, id, ...data }, idx) => {
              // The scope of this read has to be the scope the unique position index enforces, or
              // the position it derives is free to collide. That means comparing the ordering
              // fields as jsonb the way the index does, and matching seed and ephemeral exactly
              // rather than only when they are set.
              const orderingGroup = (enforceOrderingGroupByFields ?? []).map((field) =>
                literal(
                  `COALESCE(data->${sequelize.escape(field)}, 'null'::jsonb) = ${sequelize.escape(
                    JSON.stringify(data[field] ?? null),
                  )}::jsonb`,
                ),
              );

              const lastPositionResource = await Resource.findOne({
                attributes: ['Position'],
                where: {
                  type: resourceType,
                  GroupId: groupId ?? null,
                  Position: { [Op.not]: null },
                  seed: $seed ?? false,
                  ephemeral: $ephemeral ?? false,
                  ...(orderingGroup.length ? { [Op.and]: orderingGroup } : {}),
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
            ResourceType: resourceType,
            AppMemberId: appMember?.sub,
            seed,
            clonable,
            ephemeral,
          };
        }),
        { logging: false, transaction },
      );
    };
    await (publicationTransaction
      ? createResources(publicationTransaction)
      : sequelize.transaction(createResources));
  } catch (error) {
    if (preparedAssets.length) {
      await deleteS3Files(
        `app-${app.id}`,
        preparedAssets.map((asset) => asset.id),
      );
    }

    if (isUniqueConstraintErrorLike(error)) {
      throwResourceUniqueConstraintKoaErrorForResource(
        context,
        resourceType,
        resourceDefinition,
        error as UniqueConstraintError,
      );
    }

    throw error;
  }

  const persistedApp = (await App.findOne({ where: { id: app.id } }))!;

  const notify = (): void => {
    processReferenceHooks(persistedApp, createdResources[0], 'create', options, context);
    processHooks(persistedApp, createdResources[0], 'create', options, context);
  };
  if (publicationTransaction) {
    publicationTransaction.afterCommit(notify);
  } else {
    notify();
  }

  return createdResources.map((resource) => resource.toJSON());
}
