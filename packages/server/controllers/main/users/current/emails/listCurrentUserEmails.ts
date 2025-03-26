import { type Context } from 'koa';

import { EmailAuthorization } from '../../../../../models/index.js';

export async function listCurrentUserEmails(ctx: Context): Promise<void> {
  const user = ctx.user!;

  ctx.body = await EmailAuthorization.findAll({
    attributes: ['email', 'verified'],
    order: ['email'],
    raw: true,
    where: { UserId: user.id },
  });
}
