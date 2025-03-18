import { assertKoaCondition } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';

import { App, AppMember } from '../../../../models/index.js';

export async function resetAppMemberPassword(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token },
    },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id'] });

  assertKoaCondition(app != null, ctx, 404, 'App could not be found.');

  const appMember = await AppMember.findOne({
    where: { AppId: appId, resetKey: token },
    attributes: ['id'],
  });

  assertKoaCondition(appMember != null, ctx, 404, `Unknown password reset token: ${token}`);

  const password = await hash(ctx.request.body.password, 10);

  await appMember.update({
    password,
    resetKey: null,
  });
}
