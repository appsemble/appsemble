import { AppPermission } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type GroupMember as GroupMemberType } from '@appsemble/types';
import { type Context } from 'koa';

import { AppMember, Group, GroupMember } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function getGroupMembers(ctx: Context): Promise<void> {
  const {
    pathParams: { groupId },
    queryParams: { selectedGroupId },
  } = ctx;

  const group = await Group.findOne({
    where: { id: groupId },
  });

  assertKoaCondition(group != null, ctx, 404, 'Group not found.');

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: group.AppId,
    requiredPermissions: [AppPermission.QueryGroupMembers],
    groupId: selectedGroupId,
  });

  const groupMembers = await GroupMember.findAll({
    attributes: ['id', 'role'],
    where: { GroupId: groupId },
    include: [
      {
        model: AppMember,
        attributes: ['id', 'name', 'email'],
      },
    ],
  });

  ctx.body = groupMembers.map((groupMember) => ({
    id: groupMember.id,
    role: groupMember.role,
    name: groupMember.AppMember!.name,
    email: groupMember.AppMember!.email,
  })) as GroupMemberType[];
}
