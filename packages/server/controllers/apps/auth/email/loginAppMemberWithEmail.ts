import { assertKoaCondition } from '@appsemble/node-utils';
import { appOAuth2Scope } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { createAppMemberRefreshSession } from '../../../../utils/appMemberRefreshSession.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';
import { requireTotp, throwTotpRequired } from '../../../../utils/totp.js';

export async function loginAppMemberWithEmail(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    user,
  } = ctx;

  // This endpoint authenticates with basic auth, which verifies studio credentials. The subject of
  // that is a studio user, not the app member the session is created for.
  assertKoaCondition(user != null, ctx, 401, 'User is not authenticated');

  const app = await App.findByPk(appId, { attributes: ['demoMode', 'totp'] });
  // Never fall back to a permissive TOTP setting for an app which doesn’t exist.
  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const { AppMember } = await getAppDB(appId);
  // The app member is the one linked to the studio user which authenticated. Without one there is
  // nothing to issue a session for, and no second factor to check.
  const appMember = await AppMember.findOne({
    where: { userId: user.id },
    attributes: ['id', 'totpEnabled'],
  });
  assertKoaCondition(appMember != null, ctx, 401, 'App member not found');

  const aud = `app:${appId}`;

  // The credentials check out, but on apps using TOTP that’s only the first factor.
  const challenge = requireTotp(app, appMember, { aud, scope: appOAuth2Scope });
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
