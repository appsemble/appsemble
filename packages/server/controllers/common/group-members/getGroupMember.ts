import { assertKoaError } from '@appsemble/node-utils';
import { GroupPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppMember, GroupMember } from '../../../models/index.js';
import { checkAuthSubjectGroupPermissions } from '../../../utils/authorization.js';

export async function getGroupMember(ctx: Context): Promise<void> {
  const {
    pathParams: { groupMemberId },
  } = ctx;

  const groupMember = await GroupMember.findByPk(groupMemberId, {
    include: {
      model: AppMember,
    },
  });

  assertKoaError(!groupMember, ctx, 404, 'Group member not found.');

  await checkAuthSubjectGroupPermissions(ctx, groupMember.GroupId, [GroupPermission.QueryGroupMembers]);

  ctx.body = {
    id: groupMember.id,
    name: groupMember.AppMember.name,
    primaryEmail: groupMember.AppMember.email,
    role: groupMember.role,
  };
}
