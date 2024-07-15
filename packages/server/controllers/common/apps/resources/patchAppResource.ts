import { assertKoaError, getResourceDefinition, processResourceBody } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, Asset, Resource, ResourceVersion, transactional } from '../../../../models/index.js';
import { getCurrentAppMember } from '../../../../options/index.js';
import { options } from '../../../../options/options.js';

export async function patchAppResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
  } = ctx;
  const { verifyResourceActionPermission } = options;

  const action = 'patch';

  const app = await App.findByPk(appId, { attributes: ['id', 'definition', 'OrganizationId'] });

  const appMember = await getCurrentAppMember({ context: ctx });

  const definition = getResourceDefinition(app.toJSON(), resourceType, ctx);
  const memberQuery = await verifyResourceActionPermission({
    context: ctx,
    app: app.toJSON(),
    resourceType,
    action,
    options,
    ctx,
  });

  const resource = await Resource.findOne({
    where: { id: resourceId, type: resourceType, AppId: appId, ...memberQuery },
    include: [{ association: 'Author', attributes: ['id', 'name'], required: false }],
  });

  const appAssets = await Asset.findAll({
    attributes: ['id', 'name', 'ResourceId'],
    where: { AppId: appId },
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
            AppId: app.id,
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
    } else {
      promises.push(Asset.destroy({ where: { id: deletedAssetIds }, transaction }));
    }

    return Promise.all(promises);
  });
  await resource.reload({ include: [{ association: 'Editor' }] });

  ctx.body = resource;
}
