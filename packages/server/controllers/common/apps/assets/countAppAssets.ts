import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, Asset } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function countAppAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  await checkRole(ctx, app.OrganizationId, Permission.ReadAssets);

  const count = await Asset.count({
    where: { AppId: appId, ...(app.demoMode ? { seed: false, ephemeral: true } : {}) },
  });
  ctx.body = count;
}
