import { type Context } from 'koa';

import { createJWTResponse } from '../../../../utils/createJWTResponse.js';

export function loginUserWithEmail(ctx: Context): void {
  const { user } = ctx;

  ctx.body = createJWTResponse(user!.id);
}
