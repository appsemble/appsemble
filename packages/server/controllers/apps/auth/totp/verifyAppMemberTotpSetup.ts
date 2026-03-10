import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { authenticator } from 'otplib';

import { App, getAppDB } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { decrypt } from '../../../../utils/crypto.js';

export async function verifyAppMemberTotpSetup(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { memberId: bodyMemberId, token },
    },
    user: appMember,
  } = ctx;

  const { AppMember } = await getAppDB(appId);

  // Allow memberId from body for unauthenticated setup during login flow
  // for initial setup
  const memberId = appMember?.id || bodyMemberId;
  assertKoaCondition(memberId != null, ctx, 401, 'User is not authenticated');

  // Verify app settings for TOTP
  const app = await App.findByPk(appId, { attributes: ['demoMode', 'totp'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(!app.demoMode, ctx, 400, 'TOTP is not available for demo mode apps');

  // If using memberId from body (unauthenticated), verify TOTP is required
  if (!appMember && bodyMemberId) {
    assertKoaCondition(
      app.totp === 'required',
      ctx,
      403,
      'Unauthenticated TOTP verification is only allowed when TOTP is required',
    );
  }

  const member = await AppMember.findByPk(memberId);
  assertKoaCondition(member != null, ctx, 404, 'App member not found');
  assertKoaCondition(member.totpSecret != null, ctx, 400, 'TOTP setup not initiated');
  assertKoaCondition(!member.totpEnabled, ctx, 400, 'TOTP is already enabled');

  const secret = decrypt(member.totpSecret, argv.aesSecret);
  const isValid = authenticator.verify({ token, secret });

  if (!isValid) {
    throwKoaError(ctx, 400, 'Invalid TOTP token');
  }

  await member.update({ totpEnabled: true });

  ctx.status = 204;
}
