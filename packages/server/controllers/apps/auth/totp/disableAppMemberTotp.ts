import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { assertTotpToken } from '../../../../utils/totp.js';

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

  await assertTotpToken(ctx, member, token, 400);

  await member.update({ totpSecret: null, totpEnabled: false, totpLastCounter: null });

  ctx.status = 204;
}
