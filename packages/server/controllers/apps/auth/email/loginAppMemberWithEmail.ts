import { type Context } from 'koa';

import { createJWTResponse } from '../../../../utils/createJWTResponse.js';

export function loginAppMemberWithEmail(ctx: Context): void {
  const { user: appMember } = ctx;

  // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
  ctx.body = createJWTResponse(appMember.id);
}
