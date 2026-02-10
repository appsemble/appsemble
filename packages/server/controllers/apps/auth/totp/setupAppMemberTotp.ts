import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { authenticator } from 'otplib';

import { App, getAppDB } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { encrypt } from '../../../../utils/crypto.js';

export async function setupAppMemberTotp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: { body },
    user: appMember,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'demoMode', 'totp'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(!app.demoMode, ctx, 400, 'TOTP is not available for demo mode apps');
  assertKoaCondition(app.totp !== 'disabled', ctx, 400, 'TOTP is not enabled for this app');

  const { AppMember } = await getAppDB(appId);

  // Allow memberId from body for unauthenticated setup during login flow
  // This is only allowed when TOTP is required (to prevent abuse)
  const memberId = appMember?.id || (body as { memberId?: string })?.memberId;
  assertKoaCondition(memberId != null, ctx, 401, 'User is not authenticated');

  // If using memberId from body (unauthenticated), verify TOTP is required
  if (!appMember && (body as { memberId?: string })?.memberId) {
    assertKoaCondition(
      app.totp === 'required',
      ctx,
      403,
      'Unauthenticated TOTP setup is only allowed when TOTP is required',
    );
  }

  const member = await AppMember.findByPk(memberId);
  assertKoaCondition(member != null, ctx, 404, 'App member not found');
  assertKoaCondition(!member.totpEnabled, ctx, 400, 'TOTP is already enabled');

  const secret = authenticator.generateSecret();

  // Store the secret encrypted (not enabled yet until verified)
  await member.update({ totpSecret: encrypt(secret, argv.aesSecret) });

  // Generate otpauth URL for QR code
  const appName = app.definition.name || `App ${appId}`;
  const otpauthUrl = authenticator.keyuri(member.email, appName, secret);

  ctx.body = {
    secret,
    otpauthUrl,
  };
}
