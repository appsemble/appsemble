import { assertKoaError } from '@appsemble/node-utils';
import { Permissions } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, Asset } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function deleteAppAsset(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, assetId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permissions.ReadAssets);

  const assets = await Asset.findAll({
    where: {
      AppId: appId,
      id: assetId,
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });

  const [asset] = assets;
  assertKoaError(!asset, ctx, 404, 'Asset not found');

  await checkRole(ctx, app.OrganizationId, Permissions.ManageAssets);
  await asset.destroy();
}
