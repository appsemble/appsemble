import { type Context } from 'koa';

import { getUserInfoById } from '../../../../utils/user.js';

export async function getCurrentUser(ctx: Context): Promise<void> {
  const { user: authSubject } = ctx;

  ctx.body = await getUserInfoById(authSubject!.id);
}
