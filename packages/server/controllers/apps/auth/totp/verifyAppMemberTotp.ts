import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { createAppMemberRefreshSession } from '../../../../utils/appMemberRefreshSession.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';
import { assertTotpToken } from '../../../../utils/totp.js';
import {
  assertUnusedTotpPendingToken,
  verifyTotpPendingToken,
} from '../../../../utils/totpPendingToken.js';

export async function verifyAppMemberTotp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token, totpToken },
    },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['totp'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(app.totp !== 'disabled', ctx, 400, 'TOTP is not enabled for this app');

  // The pending token is the only thing binding this request to the app member whose password was
  // verified in the first step of the login flow.
  const pending = verifyTotpPendingToken(ctx, appId, totpToken);
  const { jti, scope, sub } = pending;

  const { AppMember } = await getAppDB(appId);

  const member = await AppMember.findByPk(sub);
  assertKoaCondition(member != null, ctx, 404, 'App member not found');
  assertKoaCondition(
    member.totpEnabled && member.totpSecret != null,
    ctx,
    400,
    'TOTP is not enabled for this member',
  );

  assertUnusedTotpPendingToken(ctx, pending, member);

  // Accepting the code spends the pending token along with it, in the same statement.
  await assertTotpToken(ctx, member, token, 401, jti);

  const aud = `app:${appId}`;
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
