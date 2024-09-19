import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';
import { type FindOptions, Op } from 'sequelize';

import { App, Asset } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function deleteAppAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    query: { seed },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId', 'demoMode', 'OrganizationId'],
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
    attributes: ['id'],
    where: {
      AppId: appId,
      ...(isSeed ? {} : { id: body }),
      ...(isSeed
        ? {
            [Op.or]: [{ seed: true, ephemeral: false }, handleEphemeral],
          }
        : handleEphemeral),
    },
  };

  const assets = await Asset.findAll(query);
  assertKoaError(!isSeed && assets.length === 0, ctx, 404, 'No assets found');
  assets.map(async (asset) => {
    await asset.destroy();
  });

  ctx.status = 204;
}