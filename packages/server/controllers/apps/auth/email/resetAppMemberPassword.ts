import { assertKoaError } from '@appsemble/node-utils';
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

  const app = await App.findByPk(appId, {
    attributes: [],
    include: {
      model: AppMember,
      attributes: ['id'],
      required: false,
      where: {
        resetKey: token,
      },
    },
  });

  assertKoaError(!app, ctx, 404, 'App could not be found.');
  assertKoaError(!app.AppMembers.length, ctx, 404, `Unknown password reset token: ${token}`);

  const password = await hash(ctx.request.body.password, 10);
  const [member] = app.AppMembers;

  await member.update({
    password,
    resetKey: null,
  });
}
