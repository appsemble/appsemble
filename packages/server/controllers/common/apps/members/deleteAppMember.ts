import { assertKoaCondition } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function deleteAppMember(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appMemberId },
    queryParams: { selectedGroupId },
    user: authSubject,
  } = ctx;
  const app = await App.findByPk(appId);
  assertKoaCondition(app != null, ctx, 404, 'App not found.');

  const { AppMember } = await getAppDB(appId);
  const appMember = await AppMember.findByPk(appMemberId, {
    attributes: ['id'],
  });

  assertKoaCondition(appMember != null, ctx, 404, 'App member not found');
  assertKoaCondition(
    appMemberId !== authSubject!.id,
    ctx,
    401,
    'Cannot use this endpoint to delete your own account',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [AppPermission.DeleteAppMembers],
    groupId: selectedGroupId,
  });

  await appMember.destroy();
}
