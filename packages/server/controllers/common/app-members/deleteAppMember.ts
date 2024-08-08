import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { AppMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function deleteAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appMemberId },
  } = ctx;

  const appMember = await AppMember.findByPk(appMemberId, {
    attributes: ['id', 'AppId'],
  });

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: appMember.AppId,
    requiredPermissions: [AppPermission.DeleteAppMembers],
  });

  assertKoaError(!appMember, ctx, 404, 'App member not found');

  await appMember.destroy();
}
