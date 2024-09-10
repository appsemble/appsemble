import { type Context } from 'koa';

import { getAppMemberInfoById } from '../../../../utils/appMember.js';

export async function getCurrentAppMember(ctx: Context): Promise<void> {
  const { user: authSubject } = ctx;
  ctx.body = await getAppMemberInfoById(authSubject.id);
}
