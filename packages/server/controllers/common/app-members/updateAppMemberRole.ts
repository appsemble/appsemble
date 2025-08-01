import { AppPermission, getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../models/index.js';
import { getAppMemberInfo } from '../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function updateAppMemberRole(ctx: Context): Promise<void> {
  const {
    pathParams: { appMemberId },
    queryParams: { selectedGroupId },
    request: {
      body: { role },
    },
    user: authSubject,
  } = ctx;

  const appMember = await AppMember.findByPk(appMemberId, {
    attributes: {
      exclude: ['password'],
    },
    include: [
      {
        attributes: ['id', 'definition'],
        model: App,
      },
    ],
  });

  assertKoaCondition(appMember != null, ctx, 404, 'App member not found');

  assertKoaCondition(
    appMemberId !== authSubject!.id,
    ctx,
    401,
    'Cannot use this endpoint to update your own role',
  );

  assertKoaCondition(
    getAppRoles(appMember.App!.definition.security).includes(role),
    ctx,
    401,
    'Role not allowed',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: appMember.App!.id,
    requiredPermissions: [AppPermission.UpdateAppMemberRoles],
    groupId: selectedGroupId,
  });

  const updatedAppMember = await appMember.update({ role });

  ctx.body = getAppMemberInfo(updatedAppMember);
}
