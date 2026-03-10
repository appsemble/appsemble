import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';

export async function verifyAppMemberEmail(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token },
    },
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaCondition(app != null, ctx, 404, 'App could not be found.');
  const { AppMember, AppMemberEmailAuthorization } = await getAppDB(appId);
  const emailAuth = await AppMemberEmailAuthorization.findOne({
    where: { key: token },
  });
  const appMember = await AppMember.findOne({
    // Legacy keys are supported via emailKey field of the app member.
    where: {
      ...(emailAuth ? { id: emailAuth.AppMemberId } : { emailKey: token }),
    },
    attributes: ['id', 'emailVerified', 'emailKey', 'properties'],
  });

  assertKoaCondition(appMember != null, ctx, 404, 'Unable to verify this token.');

  await appMember.update({
    emailVerified: true,
    emailKey: null,
    ...(emailAuth ? { email: emailAuth.email } : {}),
  });
  await emailAuth?.destroy();
  ctx.status = 200;
}
