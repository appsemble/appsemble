import { assertKoaCondition } from '@appsemble/node-utils';
import { appOAuth2Scope } from '@appsemble/utils';
import { type Context } from 'koa';

import { getAppDB } from '../../../../models/index.js';
import { createAppMemberRefreshSession } from '../../../../utils/appMemberRefreshSession.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';
import { requireTotp, throwTotpRequired } from '../../../../utils/totp.js';

export async function loginAppMemberWithEmail(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    user: appMember,
  } = ctx;

  assertKoaCondition(appMember != null, ctx, 401, 'User is not authenticated');

  const aud = `app:${appId}`;

  const { AppMember } = await getAppDB(appId);
  const member = await AppMember.findByPk(appMember.id, { attributes: ['id', 'totpEnabled'] });

  // The credentials check out, but on apps using TOTP that’s only the first factor.
  const challenge = await requireTotp(appId, member ?? { id: appMember.id, totpEnabled: false }, {
    aud,
    scope: appOAuth2Scope,
  });
  if (challenge) {
    throwTotpRequired(ctx, challenge);
  }

  const refreshToken = await createAppMemberRefreshSession(ctx, {
    appId,
    aud,
    scope: appOAuth2Scope,
    sub: appMember.id,
  });

  const tokenResponse = createJWTResponse(appMember.id, {
    aud,
    refreshToken: false,
    scope: appOAuth2Scope,
  });
  tokenResponse.refresh_token = refreshToken;
  ctx.body = tokenResponse;
}
