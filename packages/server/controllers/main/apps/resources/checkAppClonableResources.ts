import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';

export async function checkAppClonableResources(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;
  const { Resource } = await getAppDB(appId);
  const app = await App.findByPk(appId, { attributes: ['id'] });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  ctx.body =
    (await Resource.count({
      where: { clonable: true },
    })) > 0;
}
