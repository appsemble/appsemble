import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission } from '@appsemble/utils';
import { type Context } from 'koa';

import { AppMember, Group, GroupMember } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function getGroupMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { groupId },
  } = ctx;

  const group = await Group.findOne({
    where: { id: groupId },
  });

  assertKoaError(!group, ctx, 404, 'Group not found.');

  await checkAuthSubjectAppPermissions(ctx, groupId, [AppPermission.QueryGroupMembers]);

  const groupMembers = await GroupMember.findAll({
    where: { GroupId: groupId },
    include: [
      {
        model: AppMember,
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  ctx.body = groupMembers.map((groupMember) => ({
    id: groupMember.AppMember.id,
    name: groupMember.AppMember.name,
    primaryEmail: groupMember.AppMember.email,
    role: groupMember.role,
  }));
}
