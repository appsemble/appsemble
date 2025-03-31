import { assertKoaCondition } from '@appsemble/node-utils';
import { hash } from 'bcrypt';
import { type Context } from 'koa';

import { ResetPasswordToken, User } from '../../../../models/index.js';

export async function resetUserPassword(ctx: Context): Promise<void> {
  const {
    request: {
      body: { token },
    },
  } = ctx;

  const tokenRecord = await ResetPasswordToken.findByPk(token);

  assertKoaCondition(tokenRecord != null, ctx, 404, `Unknown password reset token: ${token}`);

  const password = await hash(ctx.request.body.password, 10);
  const user = await User.findByPk(tokenRecord.UserId);
  assertKoaCondition(user != null, ctx, 404, `Unknown user for password reset token: ${token}`);

  await user.update({ password });
  await tokenRecord.destroy();
}
