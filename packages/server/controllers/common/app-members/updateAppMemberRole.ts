import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission, getAppRoles } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember } from '../../../models/index.js';
import { getAppMemberInfo } from '../../../utils/appMember.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function updateAppMemberRole(ctx: Context): Promise<void> {
  const {
    pathParams: { appMemberId },
    request: {
      body: { role },
    },
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

  assertKoaError(!appMember, ctx, 404, 'App member not found');

  assertKoaError(
    !getAppRoles(appMember.App.definition).includes(role),
    ctx,
    401,
    'Role not allowed',
  );

  await checkAuthSubjectAppPermissions(ctx, appMember.App.id, [AppPermission.UpdateAppMemberRoles]);

  const updatedAppMember = await appMember.update({ role });

  ctx.body = getAppMemberInfo(updatedAppMember);
}
