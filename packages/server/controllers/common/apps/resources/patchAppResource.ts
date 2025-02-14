import {
  assertKoaError,
  getCompressedFileMeta,
  getResourceDefinition,
  processResourceBody,
  uploadAssets,
} from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, Asset, Resource, ResourceVersion, transactional } from '../../../../models/index.js';
import { getCurrentAppMember } from '../../../../options/index.js';
import { checkAppPermissions } from '../../../../utils/authorization.js';

export async function patchAppResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    queryParams: { selectedGroupId },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'id'],
  });

  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId, GroupId: selectedGroupId ?? null },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
  });

  assertKoaError(!resource, ctx, 404, 'Resource not found');

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

  const appMember = await getCurrentAppMember({ context: ctx });

  const definition = getResourceDefinition(app.definition, resourceType, ctx);

  const appAssets = await Asset.findAll({
    attributes: ['id', 'name', 'ResourceId'],
    where: { AppId: appId, GroupId: selectedGroupId ?? null },
  });

  assertKoaError(!resource, ctx, 404, 'Resource not found');

  const [updatedResource, preparedAssets, deletedAssetIds] = processResourceBody(
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

  await transactional((transaction) => {
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
            AppId: app.id,
            GroupId: selectedGroupId ?? null,
            ResourceId: resource.id,
            AppMemberId: appMember?.sub,
          })),
          { logging: false, transaction },
        ),
        uploadAssets(app.id, preparedAssets),
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
    } else {
      promises.push(Asset.destroy({ where: { id: deletedAssetIds }, transaction }));
    }

    return Promise.all(promises);
  });
  await resource.reload({ include: [{ association: 'Editor' }] });

  ctx.body = resource;
}
