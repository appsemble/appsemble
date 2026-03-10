import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';
import { Op } from 'sequelize';

import { App, getAppDB } from '../../../../models/index.js';

export async function deleteCurrentAppMemberUnverifiedEmail(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    queryParams: { email },
    user: authInfo,
  } = ctx;
  const app = await App.findByPk(appId, { attributes: ['id'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const { AppMember, AppMemberEmailAuthorization } = await getAppDB(appId);

  const member = await AppMember.findByPk(authInfo!.id);
  const emailAuth = await AppMemberEmailAuthorization.findOne({
    where: { [Op.and]: { AppMemberId: member!.id, email } },
  });

  assertKoaCondition(emailAuth != null, ctx, 404, 'Email not registered');

  await emailAuth.destroy();
  ctx.status = 204;
}
