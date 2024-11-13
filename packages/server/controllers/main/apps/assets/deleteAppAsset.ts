import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, Asset } from '../../../../models/index.js';
import { assetsCache } from '../../../../utils/assetCache.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function deleteAppAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [
      OrganizationPermission.QueryAppAssets,
      OrganizationPermission.DeleteAppAssets,
    ],
  });

  const asset = await Asset.findOne({
    attributes: ['id', 'name'],
    where: {
      AppId: appId,
      id: assetId,
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });

  assertKoaError(!asset, ctx, 404, 'Asset not found');

  assetsCache.mdel([`${appId}-${asset.id}`, `${appId}-${asset.name}`]);

  await asset.destroy();
}
