import { assertKoaCondition, throwKoaError } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { authenticator } from 'otplib';

import { getAppDB } from '../../../../models/index.js';
import { argv } from '../../../../utils/argv.js';
import { decrypt } from '../../../../utils/crypto.js';
import { createJWTResponse } from '../../../../utils/createJWTResponse.js';

export async function verifyAppMemberTotp(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { memberId, scope, token },
    },
  } = ctx;

  const { AppMember } = await getAppDB(appId);

  const member = await AppMember.findByPk(memberId);
  assertKoaCondition(member != null, ctx, 404, 'App member not found');
  assertKoaCondition(
    member.totpEnabled && member.totpSecret != null,
    ctx,
    400,
    'TOTP is not enabled for this member',
  );

  const secret = decrypt(member.totpSecret, argv.aesSecret);
  const isValid = authenticator.verify({ token, secret });

  if (!isValid) {
    throwKoaError(ctx, 401, 'Invalid TOTP token');
  }

  ctx.body = createJWTResponse(member.id, { aud: `app:${appId}`, scope });
}
