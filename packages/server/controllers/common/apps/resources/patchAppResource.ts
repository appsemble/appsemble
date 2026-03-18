import {
  assertKoaCondition,
  deleteS3Files,
  getCompressedFileMeta,
  getResourceDefinition,
  logger,
  processResourceBody,
  uploadAssets,
} from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { getCurrentAppMember } from '../../../../options/index.js';
import { checkAppPermissions } from '../../../../utils/authorization.js';

export async function patchAppResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    queryParams: { selectedGroupId },
    user: authSubject,
  } = ctx;
  const { Asset, Resource, ResourceVersion, sequelize } = await getAppDB(appId);
  const app = await App.findByPk(appId, {
    attributes: ['definition', 'id'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, GroupId: selectedGroupId ?? null },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
  });

  assertKoaCondition(resource != null, ctx, 404, 'Resource not found');

  await checkAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [
      resource.AuthorId === authSubject?.id
        ? `$resource:${resourceType}:own:patch`
        : `$resource:${resourceType}:patch`,
    ],
    groupId: selectedGroupId,
  });

  const appMember = await getCurrentAppMember({ context: ctx, app: app.toJSON() });

  const definition = getResourceDefinition(app.definition, resourceType, ctx);

  const appAssets = await Asset.findAll({
    attributes: ['id', 'name', 'ResourceId'],
    where: { GroupId: selectedGroupId ?? null },
  });

  const [updatedResource, preparedAssets, deletedAssetIds] = await processResourceBody(
    ctx,
    definition,
    appAssets.filter((asset) => asset.ResourceId === resourceId).map((asset) => asset.id),
    resource.expires,
    appAssets.map((asset) => ({ id: asset.id, name: asset.name })),
  );

  const {
    $clonable: clonable,
    $expires: expires,
    ...patchData
  } = updatedResource as Record<string, unknown>;

  if (preparedAssets.length) {
    await uploadAssets(app.id, preparedAssets);
  }

  try {
    await sequelize.transaction((transaction) => {
      const oldData = resource.data;
      const data = { ...oldData, ...patchData };
      const previousEditorId = resource.EditorId;
      const promises: Promise<unknown>[] = [
        resource.update({ data, clonable, expires, EditorId: appMember?.sub }, { transaction }),
      ];

      if (preparedAssets.length) {
        promises.push(
          Asset.bulkCreate(
            preparedAssets.map((asset) => ({
              ...asset,
              ...getCompressedFileMeta(asset),
              GroupId: selectedGroupId ?? null,
              ResourceId: resource.id,
              AppMemberId: appMember?.sub,
            })),
            { logging: false, transaction },
          ),
        );
      }

      if (definition.history) {
        promises.push(
          ResourceVersion.create(
            {
              ResourceId: resourceId,
              AppMemberId: previousEditorId,
              data: definition.history === true || definition.history.data ? oldData : undefined,
            },
            { transaction },
          ),
        );
      } else if (deletedAssetIds.length) {
        promises.push(Asset.destroy({ where: { id: deletedAssetIds }, transaction }));
        transaction.afterCommit(async () => {
          try {
            await deleteS3Files(`app-${app.id}`, deletedAssetIds);
          } catch (error) {
            logger.error(error);
          }
        });
      }

      return Promise.all(promises);
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
  await resource.reload({ include: [{ association: 'Editor' }] });

  ctx.body = resource;
}
