import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { EmailAuthorization, User } from '../../../models/index.js';
import { argv } from '../../../utils/argv.js';

export async function getSubscribedUsers(ctx: Context): Promise<void> {
  const {
    request: {
      headers: { authorization },
    },
  } = ctx;

  assertKoaCondition(
    !(authorization !== `Bearer ${argv.adminApiSecret}` || !argv.adminApiSecret),
    ctx,
    401,
    'Invalid or missing admin API secret',
  );

  const users = await User.findAll({
    include: {
      model: EmailAuthorization,
      where: { verified: true },
    },
    where: { deleted: null, subscribed: { [Op.eq]: true } },
  });
  const res = users.map((user) => ({
    email: user.primaryEmail,
    name: user.name,
    locale: user.locale,
  }));

  ctx.body = res;
}
