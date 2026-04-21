import {
  assertKoaCondition,
  createResourceEtag,
  deleteS3Files,
  getCompressedFileMeta,
  logger,
  matchesResourceIfMatch,
  throwResourcePreconditionFailedKoaError,
  type UpdateAppResourceParams,
  uploadAssets,
} from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';
import { type UniqueConstraintError } from 'sequelize';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { App, getAppDB } from '../models/index.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';
import {
  isUniqueConstraintErrorLike,
  throwResourceUniqueConstraintKoaErrorForResource,
} from '../utils/resourceUniqueIndexes.js';

export async function updateAppResource({
  app,
  context,
  deletedAssetIds,
  id,
  options,
  preparedAssets,
  resource,
  resourceDefinition,
  type,
}: UpdateAppResourceParams): Promise<ResourceInterface | null> {
  const { Asset, Resource, ResourceVersion, sequelize } = await getAppDB(app.id!);
  const member = await getCurrentAppMember({ context, app });
  const ifMatch = context.get('If-Match') || undefined;

  const persistedApp = (await App.findOne({ where: { id: app.id } }))!;

  const { $clonable: clonable, $expires: expires, ...data } = resource as Record<string, unknown>;

  if (preparedAssets.length) {
    await uploadAssets(app.id!, preparedAssets);
  }

  try {
    return await sequelize.transaction(async (transaction) => {
      const oldResource = await Resource.findOne({
        where: { id, type },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      assertKoaCondition(oldResource != null, context, 404, 'Resource not found');

      if (!matchesResourceIfMatch(ifMatch, createResourceEtag(oldResource.toJSON()))) {
        throwResourcePreconditionFailedKoaError(context, type, id);
      }

      const oldData = oldResource.data;
      const previousEditorId = oldResource.EditorId;
      const newResource = await oldResource.update(
        {
          data,
          clonable,
          expires,
          EditorId: member?.sub,
        },
        { transaction },
      );

      if (preparedAssets.length) {
        await Asset.bulkCreate(
          preparedAssets.map((asset) => ({
            ...asset,
            ...getCompressedFileMeta(asset),
            ResourceId: id,
            AppMemberId: member?.sub,
            seed: newResource.seed,
            clonable: newResource.clonable,
            ephemeral: newResource.ephemeral,
          })),
          { logging: false, transaction },
        );
      }

      if (resourceDefinition.history) {
        await ResourceVersion.create(
          {
            ResourceId: id,
            AppMemberId: previousEditorId,
            data:
              resourceDefinition.history === true || resourceDefinition.history.data
                ? oldData
                : undefined,
          },
          { transaction },
        );
      } else if (deletedAssetIds.length) {
        await Asset.destroy({ where: { id: deletedAssetIds }, transaction });
        transaction.afterCommit(async () => {
          try {
            await deleteS3Files(`app-${app.id}`, deletedAssetIds);
          } catch (error) {
            logger.error(error);
          }
        });
      }

      const reloaded = await newResource.reload({
        include: [
          { association: 'Author', attributes: ['id', 'name'], required: false },
          { association: 'Editor', attributes: ['id', 'name'], required: false },
          { association: 'Group', attributes: ['id', 'name'], required: false },
        ],
        transaction,
      });

      processReferenceHooks(persistedApp, newResource, 'update', options, context);
      processHooks(persistedApp, newResource, 'update', options, context);

      return reloaded.toJSON({ exclude: app.template ? ['$seed'] : undefined });
    });
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
        type,
        resourceDefinition,
        error as UniqueConstraintError,
      );
    }

    throw error;
  }
}
