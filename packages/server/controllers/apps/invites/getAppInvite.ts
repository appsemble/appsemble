import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppInvite } from '../../../models/index.js';

export async function getAppInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { token },
  } = ctx;

  const invite = await AppInvite.findOne({
    where: { key: token },
  });

  assertKoaCondition(invite != null, ctx, 404, 'This token does not exist');

  const app = await App.findByPk(invite.AppId, { attributes: ['id'] });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  ctx.body = { email: invite.email };
}
