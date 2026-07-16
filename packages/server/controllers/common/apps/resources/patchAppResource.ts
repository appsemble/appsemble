import {
  assertKoaCondition,
  deleteS3Files,
  getCompressedFileMeta,
  getResourceDefinition,
  getSingleGroupId,
  logger,
  processResourceBody,
  setResourceEtagHeader,
  uploadAssets,
  validateResourceReferences,
} from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../../models/index.js';
import { getAppResources, getCurrentAppMember } from '../../../../options/index.js';
import { checkAppPermissions } from '../../../../utils/authorization.js';
import { lockResourceWithIfMatch } from '../../../../utils/optimisticResourceLock.js';

export async function deleteAppAssets(appId: number, assetIds: string[]): Promise<void> {
  await deleteS3Files(`app-${appId}`, assetIds);
}

export async function deleteAppAssetsWithLogging(appId: number, assetIds: string[]): Promise<void> {
  try {
    await deleteAppAssets(appId, assetIds);
  } catch (error) {
    logger.error(error);
  }
}

export async function patchAppResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    queryParams: { selectedGroupId },
    user: authSubject,
  } = ctx;
  const groupId = getSingleGroupId(selectedGroupId);
  const { Asset, Resource, ResourceVersion, sequelize } = await getAppDB(appId);
  const app = await App.findByPk(appId, {
    attributes: ['definition', 'demoMode', 'id'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const lockWhere = {
    id: resourceId,
    type: resourceType,
    GroupId: groupId,
    expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
    ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
  };

  const resource = await Resource.findOne({
    where: lockWhere,
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
    // The operation acts on a single group; authorize against that group only.
    groupId,
  });

  const appMember = await getCurrentAppMember({ context: ctx, app: app.toJSON() });
  const ifMatch = ctx.get('If-Match') || undefined;

  const definition = getResourceDefinition(app.definition, resourceType, ctx);

  const appAssets = await Asset.findAll({
    attributes: ['id', 'name', 'ResourceId'],
    where: { GroupId: groupId },
  });

  const [updatedResource, preparedAssets, deletedAssetIds] = await processResourceBody(
    ctx,
    definition,
    appAssets.filter((asset) => asset.ResourceId === resourceId).map((asset) => asset.id),
    resource.expires,
    appAssets.map((asset) => ({ id: asset.id, name: asset.name })),
  );

  await validateResourceReferences(ctx, app.toJSON(), definition, updatedResource, getAppResources);

  const {
    $clonable: clonable,
    $expires: expires,
    // Exclude id from body
    id,
    ...patchData
  } = updatedResource as Record<string, unknown>;

  let uploadedAssetIds: string[] = [];

  try {
    ctx.body = await sequelize.transaction(async (transaction) => {
      const lockedResource = await lockResourceWithIfMatch({
        context: ctx,
        transaction,
        Resource,
        where: lockWhere,
        ifMatch,
        resourceType,
        resourceId,
      });

      if (preparedAssets.length) {
        await uploadAssets(app.id, preparedAssets);
        uploadedAssetIds = preparedAssets.map((asset) => asset.id);
      }

      const oldData = lockedResource.data;
      const data = { ...oldData, ...patchData };
      const previousEditorId = lockedResource.EditorId;
      const promises: Promise<unknown>[] = [
        lockedResource.update(
          { data, clonable, expires, EditorId: appMember?.sub },
          { transaction },
        ),
      ];

      if (preparedAssets.length) {
        promises.push(
          Asset.bulkCreate(
            preparedAssets.map((asset) => ({
              ...asset,
              ...getCompressedFileMeta(asset),
              GroupId: groupId,
              ResourceId: lockedResource.id,
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
          await deleteAppAssetsWithLogging(app.id, deletedAssetIds);
        });
      }

      await Promise.all(promises);

      const reloaded = await lockedResource.reload({
        include: [
          { association: 'Author', attributes: ['id', 'name'], required: false },
          { association: 'Editor', attributes: ['id', 'name'], required: false },
          { association: 'Group', attributes: ['id', 'name'], required: false },
        ],
        transaction,
      });

      return reloaded.toJSON();
    });
  } catch (error) {
    if (uploadedAssetIds.length) {
      await deleteAppAssets(app.id, uploadedAssetIds);
    }
    throw error;
  }

  setResourceEtagHeader(ctx, ctx.body as Record<string, unknown> | null | undefined);
}
