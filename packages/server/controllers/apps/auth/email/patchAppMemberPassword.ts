import { assertKoaCondition } from '@appsemble/node-utils';
import { compare, hash } from 'bcrypt';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';

export async function patchAppMemberPassword(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    user: authInfo,
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['id'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const { AppMember } = await getAppDB(appId);
  const appMember = await AppMember.findByPk(authInfo!.id, { attributes: ['password', 'id'] });
  assertKoaCondition(
    Boolean(appMember?.password),
    ctx,
    400,
    'Can not change password for this appMember',
  );
  const { currentPassword, newPassword } = ctx.request.body;
  const passwordsMatch = await compare(currentPassword, appMember!.password!);
  assertKoaCondition(passwordsMatch, ctx, 401, 'Old password is incorrect.');

  const hashedNewPassword = await hash(newPassword, 10);
  await appMember!.update({ password: hashedNewPassword });
}
