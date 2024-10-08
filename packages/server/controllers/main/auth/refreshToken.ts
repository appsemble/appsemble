import { throwKoaError } from '@appsemble/node-utils';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type Context } from 'koa';

import { argv } from '../../../utils/argv.js';
import { createJWTResponse } from '../../../utils/createJWTResponse.js';

export function refreshToken(ctx: Context): void {
  const {
    request: { body },
  } = ctx;
  let sub: string;
  try {
    ({ sub } = jwt.verify(body.refresh_token, argv.secret, { audience: argv.host }) as JwtPayload);
  } catch {
    throwKoaError(ctx, 401, 'Invalid refresh token');
  }

  ctx.body = createJWTResponse(sub);
}
