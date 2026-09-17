import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { createAppMemberRefreshSession } from '../../../../utils/appMemberRefreshSession.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';
import { assertTotpToken } from '../../../../utils/totp.js';
import {
  type TotpPendingPayload,
  verifyTotpPendingToken,
} from '../../../../utils/totpPendingToken.js';

export async function verifyAppMemberTotpSetup(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token, totpToken },
    },
    user: appMember,
  } = ctx;

  // Verify app settings for TOTP
  const app = await App.findByPk(appId, { attributes: ['demoMode', 'totp'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(!app.demoMode, ctx, 400, 'TOTP is not available for demo mode apps');
  assertKoaCondition(app.totp !== 'disabled', ctx, 400, 'TOTP is not enabled for this app');

  // During the login flow the app member has verified their password, but has no access token yet.
  // The pending token issued by that first step is what identifies them here.
  let pending: TotpPendingPayload | null = null;
  if (!appMember && totpToken) {
    pending = verifyTotpPendingToken(ctx, appId, totpToken);
  }

  const memberId = appMember?.id ?? pending?.sub;
  assertKoaCondition(memberId != null, ctx, 401, 'User is not authenticated');

  const { AppMember } = await getAppDB(appId);

  const member = await AppMember.findByPk(memberId);
  assertKoaCondition(member != null, ctx, 404, 'App member not found');
  assertKoaCondition(member.totpSecret != null, ctx, 400, 'TOTP setup not initiated');
  assertKoaCondition(!member.totpEnabled, ctx, 400, 'TOTP is already enabled');

  await assertTotpToken(ctx, member, token, 400);

  await member.update({ totpEnabled: true });

  if (!pending) {
    ctx.status = 204;
    return;
  }

  // Enrolling was the second step of the login flow, so the login is complete. Issuing the tokens
  // here means the app member doesn’t have to enter a second code, which would be rejected as a
  // replay anyway.
  const aud = `app:${appId}`;
  const { scope } = pending;
  const refreshToken = await createAppMemberRefreshSession(ctx, {
    appId,
    aud,
    scope,
    sub: member.id,
  });

  const tokenResponse = createJWTResponse(member.id, { aud, refreshToken: false, scope });
  tokenResponse.refresh_token = refreshToken;
  ctx.body = tokenResponse;
}
