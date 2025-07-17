import { AppPermission, getAppRoles } from '@appsemble/lang-sdk';
import { assertKoaCondition } from '@appsemble/node-utils';
import { type GroupMember as GroupMemberType } from '@appsemble/types';
import { type Context } from 'koa';

import { App, getAppDB } from '../../../../models/index.js';
import { checkAuthSubjectAppPermissions } from '../../../../utils/authorization.js';

export async function updateGroupMemberRole(ctx: Context): Promise<void> {
  const {
    pathParams: { appId, groupMemberId },
    queryParams: { selectedGroupId },
    request: {
      body: { role },
    },
    user: authSubject,
  } = ctx;
  const { AppMember, Group, GroupMember } = await getAppDB(appId);

  const app = await App.findByPk(appId, { attributes: ['definition'] });
  assertKoaCondition(app != null, ctx, 404, 'App not found.');

  const groupMember = await GroupMember.findByPk(groupMemberId, {
    include: [
      {
        attributes: ['id'],
        model: Group,
      },
      {
        attributes: ['name', 'email'],
        model: AppMember,
      },
    ],
  });

  assertKoaCondition(groupMember != null, ctx, 404, 'Group member not found.');

  assertKoaCondition(
    groupMember.AppMemberId !== authSubject!.id,
    ctx,
    401,
    'Cannot use this endpoint to update your own role in the group',
  );

  assertKoaCondition(
    getAppRoles(app.definition.security).includes(role),
    ctx,
    401,
    'Role not allowed',
  );

  await checkAuthSubjectAppPermissions({
    context: ctx,
    appId,
    requiredPermissions: [AppPermission.UpdateGroupMemberRoles],
    groupId: selectedGroupId,
  });

  await groupMember.update({ role });

  ctx.body = {
    id: groupMember.id,
    name: groupMember.AppMember!.name,
    email: groupMember.AppMember!.email,
    role,
  } as GroupMemberType;
}
