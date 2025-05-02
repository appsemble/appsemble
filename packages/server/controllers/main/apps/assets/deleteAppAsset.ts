import { assertKoaCondition, deleteS3File } from '@appsemble/node-utils';
import { OrganizationPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { checkUserOrganizationPermissions } from '../../../../utils/authorization.js';

export async function deleteAppAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['OrganizationId'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  await checkUserOrganizationPermissions({
    context: ctx,
    organizationId: app.OrganizationId,
    requiredPermissions: [
      OrganizationPermission.QueryAppAssets,
      OrganizationPermission.DeleteAppAssets,
    ],
  });

  const { Asset } = await getAppDB(appId);
  const asset = await Asset.findOne({
    attributes: ['id', 'name'],
    where: {
      id: assetId,
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });

  assertKoaCondition(asset != null, ctx, 404, 'Asset not found');

  await asset.destroy();

  await deleteS3File(`app-${appId}`, assetId);
}
