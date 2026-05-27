import {
  deleteS3Files,
  getCompressedFileMeta,
  logger,
  type UpdateAppResourceParams,
  uploadAssets,
} from '@appsemble/node-utils';
import { type Resource as ResourceInterface } from '@appsemble/types';
import { type UniqueConstraintError } from 'sequelize';

import { getCurrentAppMember } from './getCurrentAppMember.js';
import { App, getAppDB } from '../models/index.js';
import { lockResourceWithIfMatch } from '../utils/optimisticResourceLock.js';
import { processHooks, processReferenceHooks } from '../utils/resource.js';
import {
  isUniqueConstraintErrorLike,
  throwResourceUniqueConstraintKoaErrorForResource,
} from '../utils/resourceUniqueIndexes.js';
import { mapKeysRecursively } from '../utils/sequelize.js';

export async function updateAppResource({
  app,
  context,
  deletedAssetIds,
  id,
  ifMatch,
  lockWhere,
  options,
  preparedAssets,
  resource,
  resourceDefinition,
  type,
}: UpdateAppResourceParams): Promise<ResourceInterface | null> {
  const { Asset, Resource, ResourceVersion, sequelize } = await getAppDB(app.id!);
  const member = await getCurrentAppMember({ context, app });
  const persistedApp = (await App.findOne({ where: { id: app.id } }))!;

  const { $clonable: clonable, $expires: expires, ...data } = resource as Record<string, unknown>;
  const mappedLockWhere = mapKeysRecursively(lockWhere);

  let uploadedAssetIds: string[] = [];

  try {
    return await sequelize.transaction(async (transaction) => {
      const oldResource = await lockResourceWithIfMatch({
        context,
        transaction,
        Resource,
        where: mappedLockWhere,
        ifMatch,
        resourceType: type,
        resourceId: id,
        serializeForEtag: (model) =>
          model.toJSON({ exclude: app.template ? ['$seed'] : undefined }),
      });

      if (preparedAssets.length) {
        await uploadAssets(app.id!, preparedAssets);
        uploadedAssetIds = preparedAssets.map((asset) => asset.id);
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
    if (uploadedAssetIds.length) {
      await deleteS3Files(`app-${app.id}`, uploadedAssetIds);
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
