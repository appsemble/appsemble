import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../../models/index.js';

export async function verifyAppMemberEmail(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    request: {
      body: { token },
    },
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['definition'] });

  assertKoaCondition(app != null, ctx, 404, 'App could not be found.');

  const appMember = await AppMember.findOne({
    where: { AppId: appId, emailKey: token },
    attributes: ['id', 'emailVerified', 'emailKey'],
  });

  assertKoaCondition(appMember != null, ctx, 404, 'Unable to verify this token.');

  await appMember.update({
    emailVerified: true,
    emailKey: null,
  });

  ctx.status = 200;
}
