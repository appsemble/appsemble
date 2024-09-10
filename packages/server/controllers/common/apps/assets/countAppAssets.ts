import { assertKoaError } from '@appsemble/node-utils';
import { AppsPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, Asset } from '../../../../models/index.js';

export async function countAppAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  // @ts-expect-error TODO: FIX
  await checkRole(ctx, app.OrganizationId, AppsPermission);

  ctx.body = await Asset.count({
    where: { AppId: appId, ...(app.demoMode ? { seed: false, ephemeral: true } : {}) },
  });
}
