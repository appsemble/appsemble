import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';

export async function getAppSharedStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['sharedStyle'], raw: true });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  ctx.body = app.sharedStyle || '';
  ctx.type = 'css';
  ctx.status = 200;
}
