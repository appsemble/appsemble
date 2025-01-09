import { assertKoaError } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, Asset } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';
import { deleteFile } from '../../../../utils/s3.js';

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

  await asset.destroy();

  await deleteFile(`app-${appId}`, assetId);
}
