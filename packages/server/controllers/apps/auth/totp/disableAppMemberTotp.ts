import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { authenticator } from 'otplib';

import { App, getAppDB } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { decrypt } from '../../../../utils/crypto.js';

export async function disableAppMemberTotp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token },
    },
    user: appMember,
  } = ctx;

  assertKoaCondition(appMember != null, ctx, 401, 'User is not authenticated');

  // Check if TOTP is required at app level
  const app = await App.findByPk(appId, { attributes: ['totp'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  assertKoaCondition(
    app.totp !== 'required',
    ctx,
    403,
    'TOTP cannot be disabled when it is required by the app',
  );

  const { AppMember } = await getAppDB(appId);

  const member = await AppMember.findByPk(appMember.id);
  assertKoaCondition(member != null, ctx, 404, 'App member not found');
  assertKoaCondition(
    member.totpEnabled && member.totpSecret != null,
    ctx,
    400,
    'TOTP is not enabled',
  );

  const secret = decrypt(member.totpSecret, argv.aesSecret);
  const isValid = authenticator.verify({ token, secret });

  if (!isValid) {
    throwKoaError(ctx, 400, 'Invalid TOTP token');
  }

  await member.update({ totpSecret: null, totpEnabled: false });

  ctx.status = 204;
}
