import { throwKoaError } from '@appsemble/node-utils';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { type Context } from 'koa';

import { organizationLoginMethods, type OrganizationLoginMethod } from '@appsemble/types';

import { User } from '../../../models/index.js';
import { argv } from '../../../utils/argv.js';
import { createJWTResponse } from '../../../utils/createJWTResponse.js';
import { refreshOrganizationSsoSession } from '../../../utils/organizationSsoSession.js';

export async function refreshToken(ctx: Context): Promise<void> {
  const {
    request: { body },
  } = ctx;

  ctx.set('Cache-Control', 'no-store');
  ctx.set('Pragma', 'no-cache');

  try {
    const payload = jwt.verify(body.refresh_token, argv.secret, {
      audience: argv.host,
    }) as JwtPayload;

    if (payload.token_use !== 'refresh' || typeof payload.sub !== 'string') {
      throw new Error('Invalid refresh token');
    }

    const loginMethod = organizationLoginMethods.includes(payload.loginMethod)
      ? (payload.loginMethod as OrganizationLoginMethod)
      : undefined;
    const authTime = typeof payload.authTime === 'number' ? payload.authTime : 0;
    if (payload.organizationSsoSessionId) {
      const user = await User.findByPk(payload.sub, { attributes: ['id'] });
      if (!user) {
        throw new Error('The authenticated account is unavailable');
      }
      ctx.user = user;
      ctx.state.loginMethod = loginMethod;
      ctx.state.authTime = authTime;
      ctx.state.organizationSsoSessionId = payload.organizationSsoSessionId;
      const response = await refreshOrganizationSsoSession(ctx, body.refresh_token);
      if (!response) {
        throw new Error('Invalid organization SSO session');
      }
      ctx.body = response;
      return;
    }

    ctx.body = createJWTResponse(payload.sub, {
      aud: argv.host,
      scope: payload.scope as string | undefined,
      loginMethod,
      authTime,
    });
  } catch {
    throwKoaError(ctx, 401, 'Invalid refresh token');
  }
}
