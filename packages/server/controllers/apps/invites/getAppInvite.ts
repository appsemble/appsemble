import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../models/index.js';

export async function getAppInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, token },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['id'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppInvite } = await getAppDB(appId);
  const invite = await AppInvite.findOne({
    where: { key: token },
  });

  assertKoaCondition(invite != null, ctx, 404, 'This token does not exist');

  ctx.body = { email: invite.email };
}
