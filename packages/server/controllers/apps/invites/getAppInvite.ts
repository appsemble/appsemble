import { assertKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppInvite } from '../../../models/index.js';

export async function getAppInvite(ctx: Context): Promise<void> {
  const {
    pathParams: { token },
  } = ctx;

  const invite = await AppInvite.findOne({
    where: { key: token },
  });

  assertKoaError(!invite, ctx, 404, 'This token does not exist');

  const app = await App.findByPk(invite.AppId, { attributes: ['id'] });

  assertKoaError(!app, ctx, 404, 'App not found');

  ctx.body = { email: invite.email };
}
