import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, Asset } from '../../../../models/index.js';

export async function countAppAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['OrganizationId'],
  });

  assertKoaCondition(!!app, ctx, 404, 'App not found');

  ctx.body = await Asset.count({
    where: {
      AppId: appId,
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });
}
