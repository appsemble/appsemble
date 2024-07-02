import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppMember } from '../../../../models/index.js';
import { getAppMemberInfo } from '../../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function getAppMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
  } = ctx;

  await checkAuthSubjectAppPermissions(ctx, appId, [AppPermission.QueryAppMembers]);

  const appMembers = await AppMember.findAll({
    where: { AppId: appId },
  });

  ctx.body = appMembers.map((appMember) => getAppMemberInfo(appMember));
}
