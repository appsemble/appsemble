import { throwKoaError } from '@appsemble/node-utils';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type Context } from 'koa';

import { argv } from '../../../utils/argv.js';
import { createJWTResponse } from '../../../utils/createJWTResponse.js';

export function refreshToken(ctx: Context): void {
  const {
    request: { body },
  } = ctx;

  try {
    const payload = jwt.verify(body.refresh_token, argv.secret, {
      audience: argv.host,
    }) as JwtPayload;

    if (payload.token_use !== 'refresh' || typeof payload.sub !== 'string') {
      throw new Error('Invalid refresh token');
    }

    ctx.body = createJWTResponse(payload.sub, {
      aud: argv.host,
      scope: payload.scope as string | undefined,
    });
  } catch {
    throwKoaError(ctx, 401, 'Invalid refresh token');
  }
}
