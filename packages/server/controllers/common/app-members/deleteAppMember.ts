import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { AppMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function deleteAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appMemberId },
    queryParams: { selectedGroupId },
    user: authSubject,
  } = ctx;

  const appMember = await AppMember.findByPk(appMemberId, {
    attributes: ['id', 'AppId'],
  });

  assertKoaError(!appMember, ctx, 404, 'App member not found');
  assertKoaError(
    appMemberId === authSubject.id,
    ctx,
    401,
    'Cannot use this endpoint to delete your own account',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: appMember.AppId,
    requiredPermissions: [AppPermission.DeleteAppMembers],
    groupId: selectedGroupId,
  });

  await appMember.destroy();
}
