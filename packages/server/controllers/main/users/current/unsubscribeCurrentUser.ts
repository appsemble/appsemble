import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { User } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';

export async function unsubscribeCurrentUser(ctx: Context): Promise<void> {
  const {
    request: {
      body: { email },
      headers: { authorization },
    },
  } = ctx;

  assertKoaCondition(
    authorization === `Bearer ${argv.adminApiSecret}` && !!argv.adminApiSecret,
    ctx,
    401,
    'Invalid or missing admin API secret',
  );

  const user = await User.findOne({ where: { primaryEmail: email } });
  assertKoaCondition(!!user, ctx, 404, 'User does not exist');
  if (!user?.subscribed) {
    ctx.status = 422;
    ctx.body = "User wasn't subscribed";
    return;
  }

  user.subscribed = false;
  await user.save();

  ctx.body = `User with email ${user.primaryEmail} unsubscribed successfully`;
}
