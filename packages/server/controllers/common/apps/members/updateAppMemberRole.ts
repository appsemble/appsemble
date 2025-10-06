import { AppPermission, getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { getAppMemberInfo } from '../../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function updateAppMemberRole(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appMemberId },
    queryParams: { selectedGroupId },
    request: {
      body: { role },
    },
    user: authSubject,
  } = ctx;

  const app = await App.findByPk(appId, { attributes: ['definition', 'id'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found');
  const { AppMember } = await getAppDB(appId);

  const appMember = await AppMember.findByPk(appMemberId, {
    attributes: {
      exclude: ['password'],
    },
  });

  assertKoaCondition(appMember != null, ctx, 404, 'App member not found');

  assertKoaCondition(
    appMemberId !== authSubject!.id,
    ctx,
    401,
    'Cannot use this endpoint to update your own role',
  );

  assertKoaCondition(
    getAppRoles(app.definition.security).includes(role),
    ctx,
    401,
    'Role not allowed',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [AppPermission.UpdateAppMemberRoles],
    groupId: selectedGroupId,
  });

  const updatedAppMember = await appMember.update({ role });

  ctx.body = getAppMemberInfo(appId, updatedAppMember);
}
