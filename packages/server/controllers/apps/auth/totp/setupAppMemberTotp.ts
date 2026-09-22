import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { authenticator } from 'otplib';

import { App, getAppDB } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { encrypt } from '../../../../utils/crypto.js';
import { verifyTotpPendingToken } from '../../../../utils/totpPendingToken.js';

export async function setupAppMemberTotp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { totpToken },
    },
    user: appMember,
  } = ctx;

  const app = await App.findByPk(appId, {
    attributes: ['definition', 'demoMode', 'totp'],
  });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(!app.demoMode, ctx, 400, 'TOTP is not available for demo mode apps');
  assertKoaCondition(app.totp !== 'disabled', ctx, 400, 'TOTP is not enabled for this app');

  // During the login flow the app member has verified their password, but has no access token yet.
  // The pending token issued by that first step is what identifies them here.
  const memberId =
    appMember?.id ?? (totpToken ? verifyTotpPendingToken(ctx, appId, totpToken).sub : null);
  assertKoaCondition(memberId != null, ctx, 401, 'User is not authenticated');

  const { AppMember } = await getAppDB(appId);

  const member = await AppMember.findByPk(memberId);
  assertKoaCondition(member != null, ctx, 404, 'App member not found');
  assertKoaCondition(!member.totpEnabled, ctx, 400, 'TOTP is already enabled');

  const secret = authenticator.generateSecret();

  // Store the secret encrypted (not enabled yet until verified). The replay counter belongs to the
  // previous secret, so it’s reset along with it.
  await member.update({ totpSecret: encrypt(secret, argv.aesSecret), totpLastCounter: null });

  // Generate otpauth URL for QR code
  const appName = app.definition.name || `App ${appId}`;
  const otpauthUrl = authenticator.keyuri(member.email, appName, secret);

  ctx.body = {
    secret,
    otpauthUrl,
  };
}
