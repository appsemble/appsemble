import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, Asset } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function deleteAppAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.ManageAssets);
  const assets = await Asset.findAll({
    where: { id: body, AppId: appId },
    ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
  });
  assertKoaError(assets.length === 0, ctx, 404, 'Assets not found');
  assets.map(async (asset) => {
    await asset.destroy();
  });

  ctx.status = 204;
}
