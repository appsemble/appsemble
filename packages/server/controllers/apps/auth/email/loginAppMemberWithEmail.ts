import { type Context } from 'koa';

import { createJWTResponse } from '../../../../utils/createJWTResponse.js';

export function loginAppMemberWithEmail(ctx: Context): void {
  const { user: appMember } = ctx;

  ctx.body = createJWTResponse(appMember.id);
}
