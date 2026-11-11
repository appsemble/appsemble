import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App } from '../../../models/index.js';
import { getAppStyle } from '../../../utils/app.js';

export async function getAppCoreStyle(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id', 'password', 'coreStyle'], raw: true });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  ctx.body = getAppStyle(app, app.coreStyle);
  ctx.type = 'css';
  ctx.status = 200;
}
