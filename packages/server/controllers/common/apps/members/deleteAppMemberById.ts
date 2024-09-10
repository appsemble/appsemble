import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../../models/index.js';
import { checkRole } from '../../../../utils/checkRole.js';

export async function deleteAppMemberById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberId },
    user,
  } = ctx;

  const app = await App.findByPk(appId, {
    include: [
      {
        model: AppMember,
        attributes: ['id'],
        required: false,
        where: { UserId: memberId },
      },
    ],
  });

  assertKoaError(!app, ctx, 404, 'App not found');

  if (user.id !== memberId && !app.demoMode) {
    await checkRole(ctx, app.OrganizationId, Permission.DeleteAppAccounts);
  }

  const member = app.AppMembers?.[0];

  assertKoaError(!member, ctx, 404, 'App member not found');

  await member.destroy();
}
