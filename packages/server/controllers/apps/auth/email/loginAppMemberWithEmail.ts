import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { createAppMemberRefreshSession } from '../../../../utils/appMemberRefreshSession.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';

export async function loginAppMemberWithEmail(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    user: appMember,
  } = ctx;

  assertKoaCondition(appMember != null, ctx, 401, 'User is not authenticated');

  const aud = `app:${appId}`;
  const refreshToken = await createAppMemberRefreshSession(ctx, {
    appId,
    aud,
    sub: appMember.id,
  });

  const tokenResponse = createJWTResponse(appMember.id, { aud, refreshToken: false });
  tokenResponse.refresh_token = refreshToken;
  ctx.body = tokenResponse;
}
