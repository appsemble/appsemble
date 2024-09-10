import { assertKoaError, getResourceDefinition, processResourceBody } from '@appsemble/node-utils';
import { type Context } from 'koa';

import {
  App,
  AppMember,
  Asset,
  Organization,
  Resource,
  ResourceVersion,
  transactional,
} from '../../../../models/index.js';
import { getUserAppAccount } from '../../../../options/index.js';
import { options } from '../../../../options/options.js';

export async function patchAppResource(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, resourceId, resourceType },
    user,
  } = ctx;
  const { verifyResourceActionPermission } = options;

  const action = 'patch';

  const app = await App.findByPk(appId, {
    attributes: ['id', 'definition', 'OrganizationId'],
    include: user
      ? [
          { model: Organization, attributes: ['id'] },
          {
            model: AppMember,
            attributes: ['role', 'UserId', 'id'],
            required: false,
            where: { UserId: user.id },
          },
        ]
      : [],
  });

  const appMember = await getUserAppAccount(app.id, user?.id);

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

  let member: AppMember;
  if (app.AppMembers && app.AppMembers.length > 0) {
    member = app.AppMembers[0];
  } else if (user) {
    member = await getUserAppAccount(app.id, user.id);
  }

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
      resource.update({ data, clonable, expires, EditorId: member?.id }, { transaction }),
    ];

    if (preparedAssets.length) {
      promises.push(
        Asset.bulkCreate(
          preparedAssets.map((asset) => ({
            ...asset,
            AppId: app.id,
            ResourceId: resource.id,
            AppMemberId: appMember?.id,
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
