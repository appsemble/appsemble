import { assertKoaError } from '@appsemble/node-utils';
import { Permission } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, type User } from '../../../models/index.js';
import { parseLanguage } from '../../../utils/app.js';
import { createAppMemberQuery } from '../../../utils/appMember.js';
import { checkRole } from '../../../utils/checkRole.js';

export async function deleteAppMemberByEmail(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, memberEmail },
    user,
  } = ctx;

  const { query } = parseLanguage(ctx, ctx.query?.language);

  const app = await App.findOne({
    where: { id: appId },
    ...createAppMemberQuery(user as User, query),
  });

  assertKoaError(!app, ctx, 404, 'App account not found!');

  const [userMember] = app.AppMembers;

  if (userMember.email !== memberEmail) {
    assertKoaError(
      !app.definition?.security?.default?.role,
      ctx,
      404,
      'This app has no security definition!',
    );

    assertKoaError(
      !app.enableSelfRegistration && userMember.role !== app.definition.security.default.role,
      ctx,
      401,
    );

    if (!app.demoMode) {
      await checkRole(ctx, app.OrganizationId, Permission.DeleteAppAccounts);
    }
  }

  const appMember = await AppMember.findOne({
    attributes: {
      exclude: ['picture'],
    },
    where: {
      AppId: appId,
      email: memberEmail,
    },
  });

  assertKoaError(!appMember, ctx, 404, 'App member not found');

  await appMember.destroy();
}
