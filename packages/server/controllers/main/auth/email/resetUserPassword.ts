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

  assertKoaCondition(!!tokenRecord, ctx, 404, `Unknown password reset token: ${token}`);

  const password = await hash(ctx.request.body.password, 10);
  const user = await User.findByPk(tokenRecord.UserId);

  await user.update({ password });
  await tokenRecord.destroy();
}
