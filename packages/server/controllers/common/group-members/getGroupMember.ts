import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/types';
import { type Context } from 'koa';

import { AppMember, GroupMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function getGroupMember(ctx: Context): Promise<void> {
  const {
    pathParams: { groupMemberId },
  } = ctx;

  const groupMember = await GroupMember.findByPk(groupMemberId, {
    include: [
      {
        attributes: ['id', 'name', 'email', 'AppId'],
        model: AppMember,
      },
    ],
  });

  assertKoaError(!groupMember, ctx, 404, 'Group member not found.');

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: groupMember.AppMember.AppId,
    requiredPermissions: [AppPermission.QueryGroupMembers],
  });

  ctx.body = {
    id: groupMember.id,
    name: groupMember.AppMember.name,
    primaryEmail: groupMember.AppMember.email,
  };
}
