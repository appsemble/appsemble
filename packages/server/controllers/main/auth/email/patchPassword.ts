import { assertKoaCondition } from '@appsemble/node-utils';
import { compare, hash } from 'bcrypt';
import { type Context } from 'koa';

import { User } from '../../../../models/index.js';

export async function patchPassword(ctx: Context): Promise<void> {
  const { user } = ctx;
  const { currentPassword, newPassword } = ctx.request.body;

  const userToChange = await User.findByPk(user.id);

  const passwordsMatch = await compare(currentPassword, userToChange.password);
  assertKoaCondition(passwordsMatch, ctx, 401, 'Old password is incorrect.');

  const hashedNewPassword = await hash(newPassword, 10);
  await userToChange.update({ password: hashedNewPassword });
}
