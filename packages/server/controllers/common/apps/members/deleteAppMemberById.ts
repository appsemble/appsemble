import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppMember } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function deleteAppMemberById(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, appMemberId },
  } = ctx;

  await checkAuthSubjectAppPermissions(ctx, appId, [AppPermission.RemoveAppMembers]);

  const appMember = await AppMember.findByPk(appMemberId);

  assertKoaError(!appMember, ctx, 404, 'App member not found');

  await appMember.destroy();
}
