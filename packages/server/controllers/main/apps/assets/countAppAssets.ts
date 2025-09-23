import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';

export async function countAppAssets(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['id'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { Asset } = await getAppDB(appId);
  ctx.body = await Asset.count({
    where: {
      ...(app.demoMode ? { seed: false, ephemeral: true } : {}),
    },
  });
}
