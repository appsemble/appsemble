import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { type FindOptions, Op } from 'sequelize';

import { App, Asset } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function deleteAppAssets(ctx: Context): Promise<void> {
  const {
    assetsCache,
    pathParams: { appId },
    query: { seed },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  const isSeed = !(ctx.client && 'app' in ctx.client) && seed === 'true';

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [
      OrganizationPermission.QueryAppAssets,
      OrganizationPermission.DeleteAppAssets,
    ],
  });

  const handleEphemeral = app.demoMode ? { seed: false, ephemeral: true } : {};
  const query: FindOptions = {
    attributes: ['id', 'name'],
    where: {
      AppId: appId,
      ...(isSeed
        ? {
            [Op.or]: [{ seed: true, ephemeral: false }, handleEphemeral],
          }
        : {
            id: body,
            ...handleEphemeral,
          }),
    },
  };

  const assets = await Asset.findAll(query);

  assertKoaError(!isSeed && assets.length === 0, ctx, 404, 'No assets found');

  assets.map(async (asset) => {
    assetsCache.mdel([`${appId}-${asset.id}`, `${appId}-${asset.name}`]);
    await asset.destroy();
  });

  ctx.status = 204;
}
