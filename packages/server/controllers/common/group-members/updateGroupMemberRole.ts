import { assertKoaError } from '@appsemble/node-utils';
import { AppPermission, type GroupMember as GroupMemberType } from '@appsemble/types';
import { getAppRoles } from '@appsemble/utils';
import { type Context } from 'koa';

import { App, AppMember, Group, GroupMember } from '../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../utils/authorization.js';

export async function updateGroupMemberRole(ctx: Context): Promise<void> {
  const {
    pathParams: { groupMemberId },
    request: {
      body: { role },
    },
  } = ctx;

  const groupMember = await GroupMember.findByPk(groupMemberId, {
    include: [
      {
        attributes: ['id'],
        model: Group,
        include: [
          {
            attributes: ['id', 'definition'],
            model: App,
          },
        ],
      },
      {
        attributes: ['name', 'email'],
        model: AppMember,
      },
    ],
  });

  assertKoaError(!groupMember, ctx, 404, 'Group member not found.');

  assertKoaError(
    !getAppRoles(groupMember.Group.App.definition).includes(role),
    ctx,
    401,
    'Role not allowed',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId: groupMember.Group.App.id,
    groupId: groupMember.GroupId,
    requiredPermissions: [AppPermission.UpdateGroupMemberRoles],
  });

  await groupMember.update({ role });

  ctx.body = {
    id: groupMember.id,
    name: groupMember.AppMember.name,
    email: groupMember.AppMember.email,
    role,
  } as GroupMemberType;
}
